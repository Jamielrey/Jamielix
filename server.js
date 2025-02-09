const { serveHTTP } = require('stremio-addon-sdk');
const builder = require('./handlers');

const PORT = process.env.PORT || 3000;

// Modifica qui: aggiungi 0.0.0.0 per permettere accessi esterni
serveHTTP(builder.getInterface(), { port: PORT, address: "0.0.0.0" });

console.log(`Addon in esecuzione sulla porta ${PORT}`);
