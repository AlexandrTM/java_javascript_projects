import http from 'http';
import path from 'path';
import fs from 'fs';
import busboy from 'busboy';
import mime from 'mime-types';
import { FileService } from './FileService';

const PORT = 3000;
const fileService = new FileService();
const MAX_BYTES = 1 * 1024 * 1024;
const MAX_MB = MAX_BYTES / (1024 * 1024);

function fixMojibake(corruptedString: string): string {
    const buffer = Buffer.from(corruptedString, 'latin1');
    return buffer.toString('utf8');
}

const server = http.createServer((req, res) => {
    // CORS заголовки (если frontend и backend на разных портах, здесь они на одном)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);

    // 1. Отдача статики (Frontend)
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname.startsWith('/public'))) {
        serveStatic(req, res, url.pathname);
        return;
    }

    // 2. API: Загрузка файла
    if (req.method === 'POST' && url.pathname === '/api/upload') {
        // Устанавливаем лимит размера файла
        const bb = busboy({ 
            headers: req.headers,
            limits: {
                fileSize: MAX_BYTES 
            },
            defCharset: 'utf8'
        });

        // Обработка ошибки превышения лимита
        bb.on('filesLimit', () => {
            req.unpipe(bb); // Останавливаем обработку потока
            res.writeHead(413, { 'Connection': 'close' }); // 413 Payload Too Large
            res.end(`File limit exceeded (Max ${MAX_MB}MB)`);
        });
        
        bb.on('file', (name, file, info) => {
            const correctedFilename = fixMojibake(info.filename);
            const metadata = fileService.createFileMetadata(correctedFilename, info.mimeType);
            const writeStream = fs.createWriteStream(metadata.path);

            // Обработка ошибки, если busboy остановит поток
            file.on('limit', () => {
                 fs.unlink(metadata.path, () => {}); // Удаляем записанный файл
                 console.log(`File ${metadata.filename} exceeded size limit.`);
            });

            file.pipe(writeStream);

            writeStream.on('close', () => {
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    id: metadata.id, 
                    link: `http://${req.headers.host}/download/${metadata.id}` 
                }));
            });
        });

        bb.on('error', (err) => {
            console.error(err);
            res.writeHead(500);
            res.end("Upload failed");
        });

        req.pipe(bb);
        return;
    }

    // 3. API: Скачивание файла
    if (req.method === 'GET' && url.pathname.startsWith('/download/')) {
        const id = url.pathname.split('/')[2];
        const metadata = fileService.getFile(id);

        if (!metadata || !fs.existsSync(metadata.path)) {
            res.writeHead(404);
            res.end('File not found or expired');
            return;
        }

        const encodedFilename_RFC = encodeURIComponent(metadata.filename);
    
        const filename_Legacy = metadata.filename.replace(/"/g, '').replace(/;/g, '');
        const encodedFilename_Legacy = encodeURIComponent(filename_Legacy);
        
        const contentDisposition = `attachment; ` +
                               `filename="${encodedFilename_Legacy}"; ` +
                               `filename*=UTF-8''${encodedFilename_RFC}`;

        const stat = fs.statSync(metadata.path);
        res.writeHead(200, {
            'Content-Type': metadata.mimeType,
            'Content-Length': stat.size,
            'Content-Disposition': contentDisposition
        });

        const readStream = fs.createReadStream(metadata.path);
        readStream.pipe(res);
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

// Вспомогательная функция для статики
function serveStatic(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
    let filePath = pathname === '/' 
        ? path.join(__dirname, 'public', 'index.html') 
        : path.join(__dirname, pathname.replace('/public', 'public')); // fix path logic

    // Безопасность: предотвращение выхода за пределы директории
    if (!filePath.startsWith(path.join(__dirname, 'public'))) {
         res.writeHead(403); res.end(); return;
    }

    const ext = path.extname(filePath);
    const contentType = mime.contentType(ext) || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Page not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});