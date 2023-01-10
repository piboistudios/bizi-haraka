async function main() {
    var selfsigned = require('selfsigned');
    const attrs = [{ name: 'commonName', value: process.env.HOSTNAME || 'just.trust.me' }];

    /**@type {import('selfsigned').GenerateResult} */
    const pems = await new Promise((resolve, reject) => selfsigned.generate(attrs, { days: 90 }, (err, pems) => {
        if (err) return reject(err);
        resolve(pems);
    }));

    const fs = require('fs');

    Object.entries(pems).forEach(([file, contents]) => {
        fs.writeFileSync('config/' + file + '.pem', contents);
    });
}
module.exports = main;