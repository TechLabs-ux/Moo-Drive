document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const filesContainer = document.getElementById('filesContainer');
    const gridViewBtn = document.getElementById('gridView');
    const listViewBtn = document.getElementById('listView');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const searchInput = document.getElementById('searchInput');
    const fileModal = document.getElementById('fileModal');
    const closeBtn = document.querySelector('.close-btn');
    const modalBody = document.getElementById('modalBody');
    const downloadBtn = document.getElementById('downloadBtn');
    const currentFolder = document.getElementById('currentFolder');
    
    let currentFile = null;
    let files = [];
    
    // Alternar entre visualizações
    gridViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        filesContainer.classList.remove('list-view');
    });
    
    listViewBtn.addEventListener('click', () => {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        filesContainer.classList.add('list-view');
    });
    
    // Upload de arquivos
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async () => {
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                if (response.ok) {
                    alert('Arquivo enviado com sucesso!');
                    loadFiles();
                } else {
                    alert(`Erro: ${result.error}`);
                }
            } catch (error) {
                alert('Erro ao enviar arquivo');
                console.error(error);
            }
        }
    });
    
    // Fechar modal
    closeBtn.addEventListener('click', () => {
        fileModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === fileModal) {
            fileModal.style.display = 'none';
        }
    });
    
    // Baixar arquivo
    downloadBtn.addEventListener('click', () => {
        if (currentFile) {
            window.open(`/api/download/${currentFile.name}`, '_blank');
        }
    });
    
    // Pesquisar arquivos
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredFiles = files.filter(file => 
            file.name.toLowerCase().includes(searchTerm)
        );
        renderFiles(filteredFiles);
    });
    
    // Carregar arquivos
    async function loadFiles() {
        try {
            const response = await fetch('/api/files');
            files = await response.json();
            renderFiles(files);
        } catch (error) {
            console.error('Erro ao carregar arquivos:', error);
        }
    }
    
    // Renderizar arquivos
    function renderFiles(filesToRender) {
        filesContainer.innerHTML = '';
        
        filesToRender.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            fileCard.dataset.name = file.name;
            
            const icon = getFileIcon(file);
            const size = formatFileSize(file.size);
            const modified = new Date(file.modified).toLocaleDateString();
            
            fileCard.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-name">${file.name}</div>
                <div class="file-info">${size} · ${modified}</div>
            `;
            
            fileCard.addEventListener('click', () => openFile(file));
            filesContainer.appendChild(fileCard);
        });
    }
    
    // Abrir arquivo
    function openFile(file) {
        currentFile = file;
        
        if (file.isDirectory) {
            alert('Navegação para pastas não implementada neste exemplo');
            return;
        }
        
        // Verificar tipo de arquivo para visualização
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const videoTypes = ['mp4', 'webm', 'ogg'];
        
        if (imageTypes.includes(file.type)) {
            modalBody.innerHTML = `<img src="${file.path}" alt="${file.name}">`;
        } else if (videoTypes.includes(file.type)) {
            modalBody.innerHTML = `
                <video controls>
                    <source src="${file.path}" type="video/${file.type}">
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            `;
        } else {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-file" style="font-size: 5rem; margin-bottom: 20px;"></i>
                    <p>Visualização não disponível para este tipo de arquivo.</p>
                </div>
            `;
        }
        
        fileModal.style.display = 'block';
    }
    
    // Obter ícone apropriado para o arquivo
    function getFileIcon(file) {
        if (file.isDirectory) return '<i class="far fa-folder"></i>';
        
        const type = file.type || 'file';
        const icons = {
            pdf: 'file-pdf',
            doc: 'file-word',
            docx: 'file-word',
            xls: 'file-excel',
            xlsx: 'file-excel',
            ppt: 'file-powerpoint',
            pptx: 'file-powerpoint',
            jpg: 'file-image',
            jpeg: 'file-image',
            png: 'file-image',
            gif: 'file-image',
            mp3: 'file-audio',
            wav: 'file-audio',
            mp4: 'file-video',
            webm: 'file-video',
            mov: 'file-video',
            zip: 'file-archive',
            rar: 'file-archive',
            txt: 'file-alt',
            html: 'file-code',
            css: 'file-code',
            js: 'file-code',
            json: 'file-code'
        };
        
        return `<i class="far fa-${icons[type] || 'file'}"></i>`;
    }
    
    // Formatar tamanho do arquivo
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    // Inicializar
    loadFiles();
});