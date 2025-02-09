const { serveHTTP } = require('stremio-addon-sdk');
const builder = require('./handlers');

const port = process.env.PORT || 4000;
serveHTTP(builder.getInterface(), { port });
