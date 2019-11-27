const axios = require('axios');
const keytar = require('keytar');
const program = require('commander');

axios.post('https://accounts.zoho.com/oauth/v3/device/code', {}, {
    params: {
        client_id: '1000.VQHN4RUSH8H3TSRWPNM7LOJUEJRHRH',
        grant_type: 'device_request',
        scope: 'ZohoVault.secrets.READ'
    }
}).then(response => {
    console.log(response.data);
}).catch(err => {
    console.error(err);
});

// program.version('0.0.1');

// program
// .command('set <value>')
// .description('set a password')
// .action((key) => {
//     keytar.setPassword('vault', 'default', '0007');
// });

// program
// .command('get')
// .description('get a password')
// .action(async () => {
//     console.log(await keytar.getPassword('vault', 'default'));
// })

// program.parse(process.argv);