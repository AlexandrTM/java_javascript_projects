import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface FileMetadata {
    id: string;
    filename: string;
    path: string;
    mimeType: string;
    createdAt: number;
    lastAccess: number;
}

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const METADATA_FILE = path.join(__dirname, '..', 'metadata.json');
// Время жизни файла без скачиваний (например, 30 дней).
const FILE_LIFE_TIME_MS = 30 * 24 * 60 * 60 * 1000;
//const FILE_LIFE_TIME_MS = 20 * 1000;

export class FileService {
    // Хранилище метаданных в памяти
    private fileStore: Map<string, FileMetadata> = new Map();

    constructor() {
        // Создаем папку uploads, если нет
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR);
        }

        // Загрузка метаданных файлов в папке uploads при старте
        this.loadMetadata();

        // Запускаем задачу очистки раз в час
        setInterval(() => this.cleanupOldFiles(), 60 * 60 * 1000);
    }

    private loadMetadata() {
        if (fs.existsSync(METADATA_FILE)) {
            try {
                const data = fs.readFileSync(METADATA_FILE, 'utf-8');
                const metadataArray: FileMetadata[] = JSON.parse(data);
                
                // Проверяем существование файла на диске перед добавлением в Map
                metadataArray.forEach(meta => {
                    if (fs.existsSync(meta.path)) {
                        this.fileStore.set(meta.id, meta);
                    } else {
                         // Если метаданные есть, а файла нет, игнорируем или удаляем запись.
                         console.warn(`File ${meta.filename} not found on disk, skipping metadata.`);
                    }
                });

                console.log(`Loaded ${this.fileStore.size} file metadata entries.`);
            } catch (err) {
                console.error('Failed to load metadata:', err);
            }
        }
    }
    private saveMetadata() {
        try {
            const data = Array.from(this.fileStore.values());
            fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('Failed to save metadata:', err);
        }
    }

    // Генерация ID и пути для нового файла
    createFileMetadata(filename: string, mimeType: string): FileMetadata {
        const id = uuidv4();
        const filePath = path.join(UPLOAD_DIR, `${id}_${filename}`);
        
        const metadata: FileMetadata = {
            id,
            filename,
            path: filePath,
            mimeType,
            createdAt: Date.now(),
            lastAccess: Date.now()
        };
        
        this.fileStore.set(id, metadata);
        this.saveMetadata();
        return metadata;
    }

    getFile(id: string): FileMetadata | undefined {
        const file = this.fileStore.get(id);
        if (file) {
            file.lastAccess = Date.now(); // Обновляем время доступа
            this.saveMetadata(); // Обновляем lastAccess
        }
        return file;
    }

    private cleanupOldFiles() {
        console.log('Running cleanup job...');
        const now = Date.now();
        let deletedCount = 0;
        
        this.fileStore.forEach((file, id) => {
            // Проверяем, существует ли файл физически, прежде чем удалять
            if (!fs.existsSync(file.path)) {
                console.warn(`File ${file.filename} missing from disk, removing metadata.`);
                this.fileStore.delete(id);
                return;
            }
            
            if (now - file.lastAccess > FILE_LIFE_TIME_MS) {
                this._deleteFile(id);
                deletedCount++;
            }
        });
        if (deletedCount > 0) {
            console.log(`Cleanup job finished. Deleted ${deletedCount} files.`);
            this.saveMetadata(); // Сохраняем состояние после удалений
        }
    }
    private _deleteFile(id: string) {
        const file = this.fileStore.get(id);
        if (file) {
            // Удаляем физически
            fs.unlink(file.path, (err) => {
                if (err) console.error(`Failed to delete file ${file.filename}:`, err);
                else console.log(`Deleted expired file: ${file.filename}`);
            });
            // Удаляем из памяти
            this.fileStore.delete(id);
        }
    }
}