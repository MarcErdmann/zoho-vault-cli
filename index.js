const keytar = require('keytar');
const program = require('commander');

program.version('0.0.1');

program
.command('set <value>')
.description('set a password')
.action((key) => {
    keytar.setPassword('vault', 'default', '0007');
});

program
.command('get')
.description('get a password')
.action(async () => {
    console.log(await keytar.getPassword('vault', 'default'));
})

program.parse(process.argv);