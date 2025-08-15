const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 1080;

// Configurações
const UPLOAD_FOLDER = './files';
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

// Configuração do Multer para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_FOLDER);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos estáticos da pasta public
app.use('/files', express.static(path.join(__dirname, 'files'))); // Serve arquivos da pasta files

// Rota principal - redireciona para o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rotas da API
app.get('/api/files', (req, res) => {
    fs.readdir(UPLOAD_FOLDER, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao ler a pasta' });
        }

        const fileData = files.map(file => {
            const filePath = path.join(UPLOAD_FOLDER, file);
            const stats = fs.statSync(filePath);
            
            return {
                name: file,
                path: `/files/${file}`,
                size: stats.size,
                modified: stats.mtime,
                type: path.extname(file).substring(1).toLowerCase(),
                isDirectory: stats.isDirectory()
            };
        });

        res.json(fileData);
    });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    res.json({ message: 'Arquivo enviado com sucesso', file: req.file });
});

app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(UPLOAD_FOLDER, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'Arquivo não encontrado' });
    }
});

// Obter endereços de rede
function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            // Ignora endereços IPv6 e locais (loopback)
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }
    
    return addresses;
}

// Iniciar servidor em todos os endereços de rede
const server = app.listen(PORT, '0.0.0.0', () => {
    const networkAddresses = getNetworkInterfaces();
    
    console.log(`Servidor rodando em:`);
    console.log(`- Local: http://localhost:${PORT}`);
    
    networkAddresses.forEach(ip => {
        console.log(`- Rede: http://${ip}:${PORT}`);
    });
});

// Tratamento de erros
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Porta ${PORT} já está em uso.`);
    } else {
        console.error('Erro ao iniciar o servidor:', error);
    }
    process.exit(1);
});