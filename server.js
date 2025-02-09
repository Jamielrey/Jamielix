const { serveHTTP } = require('stremio-addon-sdk');
const builder = require('./handlers');

// Usa la porta dinamica assegnata da Render
const PORT = process.env.PORT || 3000;

serveHTTP(builder.getInterface(), { port: PORT });

console.log(`Addon in esecuzione sulla porta ${PORT}`);
