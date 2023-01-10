const fs = require('fs');
const util = require('util');
const mongoose = require('mongoose');
const objMerge = require('object-merge');
const handlebars = require('handlebars');
const { promisify } = require('bluebird');
let logger;
let mCnx;
exports.register = function () {
    logger = this;
    logger.logdebug("About to connect and initialize queue object");
    this.init_mongoose();
    logger.logdebug(`Finished initiating`);
}

exports.init_mongoose = function () {
    const plugin = this;
    const config = plugin.config.get('mongoose.ini');
    const options = {};
    const dsnFn = handlebars.compile('mongodb://{{user}}:{{pass}}@{{host}}:{{port}}/{{collection}}');
    Object.assign(options, config.mongo);
    options.pass = encodeURIComponent(options.pass);
    options.user = encodeURIComponent(options.user);
    const dsn = dsnFn(options);
    const dsnRedacted = dsnFn({ ...options, pass: "(REDACTED)" });
    plugin.loginfo(`Connecting to ${dsnRedacted}`);
    logger.logdebug("Mongo DSN:", dsn);
    const connectOpts = { ssl: Boolean(options.ssl), sslValidate: Boolean(options.sslValidate), authSource: options.authSource }/* , { ssl: true, sslValidate: false } */
    logger.logdebug("Mongo connectOpts:", connectOpts);
    mongoose.connect(dsn, connectOpts)
        .then(cnx => {
            mCnx = cnx;
            plugin.loginfo(`Connected to ${dsnRedacted}`);
        })
        .catch(e => {
            logger.logerror("Unable to connect to MongoDB:" + e);
        })
}

exports.hook_queue = async function (next, connection) {
    if (!connection?.transaction) return next();
    const plugin = this;
    /**@type {import('../../models/mail-message')} */
    const MailMessage = require('./models/mail-message');
    /**@type {import('../../models/mailbox-mail-message')} */
    const MailboxMailMessage = require('./models/mailbox-mail-message');
    /**@type {import('../../models/mailbox')} */
    const Mailbox = require('./models/mailbox');
    /**@type {import('../../models/raw-email')} */
    const RawEmail = require('../../models/raw-email');
    plugin.logdebug("connection: " + util.inspect(connection,null, 5));
    const connectionData = { ...connection.transaction };
    plugin.logdebug("connection:", util.inspect(connectionData));
    connectionData.results = undefined;
    connectionData.transaction = connectionData.transasction || {};
    connectionData.transaction.message_stream = undefined;
    const msgId = connectionData.header.headers["message-id"][0].trim();
    const existingMessage = await MailMessage.findOne({
        "data.header.headers.message-id": msgId
    });
    const newData = {
        diagnostics: connection?.transaction?.results?.store,
        data: connectionData
    };
    if (existingMessage) {
        existingMessage = objMerge(existingMessage, newData);
    }
    const mailMessage = existingMessage || new MailMessage(newData);
    if (!existingMessage) {

        const rawMsg = await promisify(RawEmail.write, { context: RawEmail })({
            filename: `${msgId}.eml`,
            contentType: 'application/octet-stream',
            metadata: {
                mailMessageId: mailMessage._id
            }
        }, connection.transaction.message_stream);
        mailMessage.rawMsgId = rawMsg._id;
    }
    await mailMessage.save();
    // 636e54511a1314e82eeca46f 636e54510da0da81150000ed
    // 
    await Promise.all(connection.transaction.rcpt_to.map(r => r.address()).map(async r => {
        let mailbox;
        try {
            mailbox = await Mailbox.findOne({
                address: r,
                name: 'INBOX'
            });
            if (!mailbox) {
                mailbox = new Mailbox({
                    address: r,
                    name: 'INBOX'
                });
                await mailbox.save();
            }
            const mailboxMailMessage = new MailboxMailMessage({
                mailboxId: mailbox._id,
                mailMessageId: mailMessage._id
            });
            await mailboxMailMessage.save();
        } catch (e) {
            plugin.logerror("Unable to deliver mail to " + r + " :" + e);
        }
    }));
    next(OK);
    // const ws = fs.createWriteStream(`${tempDir}/mail.eml`);
    // fs.writeFileSync(`${tempDir}/tx.json`, JSON.stringify(connection.transaction, null, 4));
    // connection.logdebug(this, `Saving to ${tempDir}/mail.eml`);
    // ws.once('close', () => next(OK));
    // connection.transaction.message_stream.pipe(ws);

}


exports.hook_queue_outbound = async function (next, connection) {
    if (!connection?.transaction) return next();

    const plugin = this;
    /**@type {import('../../models/mail-message')} */
    const MailMessage = require('./models/mail-message');
    /**@type {import('../../models/mailbox-mail-message')} */
    const MailboxMailMessage = require('./models/mailbox-mail-message');
    /**@type {import('../../models/mailbox')} */
    const Mailbox = require('./models/mailbox');
    /**@type {import('../../models/raw-email')} */
    const RawEmail = require('../../models/raw-email');

    const connectionData = { ...connection.transaction };
    connectionData.results = undefined;
    connectionData.message_stream = undefined;
    const msgId = connectionData.header.headers["message-id"][0].trim();
    plugin.lognotice("Creating mail message");
    plugin.loginfo("connection msg id..." + msgId)
    let existingMessage = await MailMessage.findOne({
        "data.header.headers.message-id": msgId
    });
    const newData = {
        diagnostics: connection.transaction.results.store,
        data: connectionData
    };
    if (existingMessage) {
        existingMessage = objMerge(existingMessage, newData);
    }
    const mailMessage = existingMessage || new MailMessage(newData);
    if (!existingMessage) {

        plugin.lognotice("Writing raw email", `${connection.transaction.uuid}.eml`);
        const rawMsg = await promisify(RawEmail.write, { context: RawEmail })({
            filename: `${msgId}.eml`,
            contentType: 'application/octet-stream',
            metadata: {
                mailMessageId: mailMessage._id
            }
        }, connection.transaction.message_stream);
        plugin.loginfo("Raw:", rawMsg);
        mailMessage.rawMsgId = rawMsg._id;
    }
    await mailMessage.save();
    plugin.lognotice("Mail message saved.");
    plugin.lognotice(mailMessage.rawMsgId);
    const r = connection.transaction.mail_from.address();
    let mailbox;
    try {
        mailbox = await Mailbox.findOne({
            address: r,
            name: 'OUTBOX'
        });
        if (!mailbox) {
            mailbox = new Mailbox({
                address: r,
                name: 'OUTBOX'
            });
            await mailbox.save();
        }
        const mailboxMailMessage = new MailboxMailMessage({
            mailboxId: mailbox._id,
            mailMessageId: mailMessage._id
        });
        await mailboxMailMessage.save();
    } catch (e) {
        plugin.logerror("Unable to deliver mail to " + r + " :" + e);
    }

    next(OK);
}
