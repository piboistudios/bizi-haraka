// require('dotenv').config();
// const mongooseCfg = `
// [mongo]
// user=${process.env.DB_USER || ''}
// pass=${process.env.DB_PASS || ''}
// host=${process.env.DB_ADDR || ''}
// port=${process.env.DB_PORT || ''}
// ssl=${process.env.DB_SSL || ''}
// sslValidate=${process.env.DB_SSL_VALIDATE || ''}
// authSource=${process.env.DB_AUTH_SOURCE || ''}`

const fs = require('fs');

// fs.writeFileSync('config/mongoose.ini', mongooseCfg.trim());
const debug = require('debug')('compile-handlebars');

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv)).argv
const handlebars = require('handlebars');

const { join } = require('path');
const path = require('path');
function tryParse(v) {
    try {
        return JSON.parse(v);
    } catch (e) {
        return v;
    }
}

const outputDir = argv.out || 'config';
const inDir = argv.in || 'config-templates'
if (outputDir && !fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
const extensions = ['.ini', '.hosts'];
const excludedExtensions = ['.sh'];
Object.entries(argv).forEach(([key, value]) => {
    debug("Handling:", value);
    if (!(value instanceof Array)) {
        argv[key] = tryParse(value);
    } else {
        argv[key] = value.map(tryParse);
    }
});
debug({ argv });
// return;
function traverse(dir, root) {


    fs.readdirSync(dir).forEach(f => {
        // if(!extensions.includes(path.extname(f))) return debug("Skipping", f);
        if (excludedExtensions.includes(path.extname(f))) return debug("Skipping", f);

        const file = join(dir, f);
        const out = join(outputDir, file.split('/').slice(1).join('/'));
        const outDir = path.dirname(out);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);


        if (fs.statSync(file).isDirectory()) {
            return traverse(file);
        }
        const template = fs.readFileSync(file).toString();
        const compiled = handlebars.compile(template);

        const pkgJson = require('./package.json');

        fs.writeFileSync(out, compiled({
            packageJson: pkgJson,
            ...argv,

        }))
    });
}
traverse(inDir, true);
if(argv.start) {
    require('./haraka');
}