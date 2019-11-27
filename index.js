require('dotenv').config();

const axios = require('axios');
const program = require('commander');
const dayjs = require('dayjs');
const express = require('express');
const keytar = require('keytar');
const open = require('open');

function login() {
    return new Promise((resolve, reject) => {
        const app = express();
        let server = undefined;

        app.get('/callback', (req, res) => {
            res.sendStatus(200);
            server.close();

            axios.post('https://accounts.zoho.com/oauth/v2/token', {}, {
                params: {
                    client_id: process.env.API_KEY,
                    client_secret: process.env.API_SECRET,
                    grant_type: 'authorization_code',
                    scope: 'ZohoVault.secrets.READ',
                    redirect_uri: 'http://localhost:37195/callback',
                    code: req.query.code
                }
            }).then(response => {
                response.data.expires_at = dayjs().add(response.data.expires_in, 'second');
                resolve(response.data);
            }).catch(err => {
                reject(err);
            });
        });

        server = app.listen(37195);

        open(`https://accounts.zoho.com/oauth/v2/auth?client_id=${process.env.API_KEY}&response_type=code&redirect_uri=http://localhost:37195/callback&scope=ZohoVault.secrets.READ`);
    });
}

// Try to get access token from gnome keyring
keytar.getPassword('zoho-vault', 'default').then(token => {
    if (!token) {
        // login if the token is not available in gnome keyring
        return login();
    } else {
        // otherwise parse the token and check if still valid
        // login if not valid anymore
        token = JSON.parse(token);
        return dayjs().isBefore(token.expires_at) ? token : login();
    }
}).then(token => {
    // Save current token to gnome keyring
    return keytar.setPassword('zoho-vault', 'default', JSON.stringify(token)).then(() => {
        return token;
    });
}).then(token => {
    // perform action
}).catch(err => {
    console.error('Unable to recover from error', err);
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