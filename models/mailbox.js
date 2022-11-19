const mongoose = require('mongoose'),
    Schema = mongoose.Schema
/**
 * The stored schema is not actually an ldap schema, but we do have
 * the fields we need to store in order to return an ldap account
 * fully qualified under the posixAccount Schema AND/OR the inetOrgPerson
 * Schema
 **/
const mailboxSchema = new Schema({
    address: String,
    name: String,
});

module.exports = mongoose.model("Mailbox", mailboxSchema);
