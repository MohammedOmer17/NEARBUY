const http = require('http');
const fs = require('node:fs');
const path = require('node:path');

const envFilePath = path.join(__dirname, '.env');
if (fs.existsSync(envFilePath)) {
    process.loadEnvFile(envFilePath);
}

const app = require('./app');
const connectToDb = require('./db/db');
const port = 3000;

async function startServer() {
    await connectToDb();

    const server = http.createServer(app);
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exitCode = 1;
});