const nodemailer = require('nodemailer');
// const bunyan = require('bunyan');
// const logger = bunyan.createLogger({
    
// });
const transport = nodemailer.createTransport({
    host: "localhost",
    port: 25,
    secure: false,
    logger:true,
    authMethod: "login",
    auth: {
        user: "topboy",
        pass: "CmZeuEUQbf3IpX",
    }
});
async function main() {
    const msg = {
        from: '"The Grand Poobah / Imperial Falconer / Boss Dog 👑" <topboy@gabedev.tech>', // sender address
        to: "topboy@gabedev.tech", // list of receivers
        subject: "Who ya gonna call?", // Subject line
        text: "Webmasta", // plain text body
        html: "<b>Webmaster 😎</b>", // html body
      };
    await transport.verify();
    console.log("auth works...");

    await transport.sendMail(msg);
      return {sent: {msg}};
}
main()
    .then(console.log)
    .catch(console.error);