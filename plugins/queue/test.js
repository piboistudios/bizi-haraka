const fs = require('fs');
const os = require('os');
const util = require('util');
const tempDir = os.tmpdir();

exports.hook_queue = function (next, connection) {
    if (!connection?.transaction) return next();

    const ws = fs.createWriteStream(`${tempDir}/mail.eml`);
    fs.writeFileSync(`${tempDir}/tx.json`, JSON.stringify(connection.transaction, null, 4));
    connection.logdebug(this, `Saving to ${tempDir}/mail.eml`);
    ws.once('close', () => next(OK));
    connection.transaction.message_stream.pipe(ws);
}


exports.hook_queue_outbound = function (next, connection) {
    if (!connection?.transaction) return next();

    const ws = fs.createWriteStream(`${tempDir}/mail.eml`);
    fs.writeFileSync(`${tempDir}/tx.obj`, util.inspect({ tests: connection.results.store, tx: connection.transaction }, null, 4));
    connection.logdebug(this, `Saving to ${tempDir}/mail.eml`);
    ws.once('close', () => next(OK));
    connection.transaction.message_stream.pipe(ws);
}
