const fileInputElement = document.getElementById('file-input')
const shareButton = document.getElementById('share-btn')
const dynamicContent = document.querySelector('.dynamic-content')
const socket = io()

window.addEventListener('load', () => {

    let newFile = {
        buffer: [],
        metadata: null,
        receivedSize: 0
        }
        
        socket.on('file-metadata', metadata => {
            newFile.metadata = metadata;
            newFile.buffer = [];
            newFile.receivedSize = 0;  
            console.log('received metadata ⚡️', metadata);
        });
        socket.on('file-chunk', chunk => {
            newFile.buffer.push(chunk);
            newFile.receivedSize += chunk.byteLength; 
            if (newFile.receivedSize === newFile.metadata.bufferSize) {
                let receivedFile = new Blob(newFile.buffer);
                downloadFile(receivedFile, newFile.metadata.filename);
    
                newFile = {};
                alert('Yayy! File received 🎉');
            }
        });

     
})

function downloadFile(blob, name = 'shared.txt') {
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    
    link.href = blobUrl;
    link.download = name;
    document.body.appendChild(link);
    
    link.dispatchEvent(
        new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        })
    );
    
    document.body.removeChild(link);
}

shareButton.addEventListener('click', async () => {
    if (fileInputElement.files.length === 0) {
        alert('Choose the file you want to send 📁')
        return;
    }

    let file = fileInputElement.files[0]
    let reader = new FileReader()

    reader.onload = () => {
        let buffer = new Uint8Array(reader.result)
        initFileShare({ filename: file.name, bufferSize: buffer.length }, buffer)
        
    }

    reader.readAsArrayBuffer(file)
})

function initFileShare(metadata, buffer) {
    socket.emit('file-metadata', metadata);
    console.log(metadata)
    let chunkSize = 1024;
    let initialChunk = 0;
    
    while (initialChunk < metadata.bufferSize) {
        let end = Math.min(initialChunk + chunkSize, metadata.bufferSize);


        console.log('start: ', initialChunk , 'end:' ,end)
        let filePiece = buffer.slice(initialChunk, end);
       
    
        socket.emit('file-chunk', filePiece);
    
        initialChunk += chunkSize;
    }
    }