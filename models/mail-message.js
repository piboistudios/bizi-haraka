const mongoose = require('mongoose'),
    Schema = mongoose.Schema
/**
 * The stored schema is not actually an ldap schema, but we do have
 * the fields we need to store in order to return an ldap account
 * fully qualified under the posixAccount Schema AND/OR the inetOrgPerson
 * Schema
 **/
const mailMessageSchema = new Schema({
    diagnostics: {

    },
    data: {
        uuid: String,
        mail_from: String,
        rcpt_to: [String],
        header_lines: [String],
        data_lines: [String],
        data_bytes: Number,
        rcpt_count: [{
            accept: Number,
            tempfail: Number,
            reject: Number
        }],
        encoding: String,
        mime_part_count: Number
    },
    rawMsgId: Schema.Types.ObjectId

}, { strict: false });
mailMessageSchema.virtual('raw', {
    ref: 'RawEmail',
    foreignField: '_id',
    localField: 'rawMsgId'
})
mailMessageSchema.pre('save', function (next) {
    this.modified = new Date();
    next()
});
module.exports = mongoose.model("MailMessage", mailMessageSchema);
// const t = new module.exports();
