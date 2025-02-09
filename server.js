const { serveHTTP } = require('stremio-addon-sdk');
const builder = require('./handlers');

serveHTTP(builder.getInterface(), { port: 3000 });