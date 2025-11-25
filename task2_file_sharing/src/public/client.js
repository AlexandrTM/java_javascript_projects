function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) return alert("Please select a file");

    const MAX_BYTES = 1 * 1024 * 1024;
    const MAX_MB = MAX_BYTES / (1024 * 1024);

    if (file.size > MAX_BYTES) {
        alert(`Error: File size must not exceed ${MAX_MB}MB.`);
        // Сбрасываем прогресс и останавливаем функцию
        document.getElementById('progressContainer').classList.add('hidden');
        return; 
    }

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    // UI Elements
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const statusText = document.getElementById('statusText');
    const resultContainer = document.getElementById('resultContainer');
    
    progressContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');

    // Progress Event
    xhr.upload.onprogress = function(event) {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressFill.style.width = percentComplete + '%';
            statusText.innerText = Math.round(percentComplete) + '%';
        }
    };

    xhr.onload = function() {
        const xhrStatus = xhr.status;
        let response = {};
        
        try {
            response = JSON.parse(xhr.responseText);
        } catch (e) {
            // Если ответ не JSON (например 404), используем стандартный объект
            response.message = xhr.responseText || `Server responded with status ${xhrStatus}.`;
        }
        
        if (xhrStatus === 201) {
            document.getElementById('fileLink').value = response.link;
            resultContainer.classList.remove('hidden');
            statusText.innerText = "Done!";
            
        } else {
            // Очищаем индикатор прогресса и отображаем контейнер результата для сообщения об ошибке
            progressFill.style.width = '0%';
            progressContainer.classList.add('hidden');
            
            alert(`Upload Failed (${xhrStatus}): ${response.message || 'Unknown error.'}`);
            statusText.innerText = "Upload Failed.";
        }
    };

    xhr.onerror = function() {
        statusText.innerText = "Network Error";
    };

    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
}

function copyLink() {
    const copyText = document.getElementById("fileLink");
    copyText.select();
    document.execCommand("copy");
    alert("Link copied!");
}