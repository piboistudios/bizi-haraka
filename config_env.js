require('dotenv').config();
const mongooseCfg = `
[mongo]
user=${process.env.DB_USER || ''}
pass=${process.env.DB_PASS || ''}
host=${process.env.DB_ADDR || ''}
port=${process.env.DB_PORT || ''}
ssl=${process.env.DB_SSL || ''}
sslValidate=${process.env.DB_SSL_VALIDATE || ''}
authSource=${process.env.DB_AUTH_SOURCE || ''}`

const fs = require('fs');

fs.writeFileSync('config/mongoose.ini', mongooseCfg.trim());