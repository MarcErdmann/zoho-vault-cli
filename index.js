require('dotenv').config();

const axios = require('axios');
const program = require('commander');
const dayjs = require('dayjs');
const keytar = require('keytar');

const login = require('./login');

program.version('0.0.1');

program
    .command('get <name> <field>')
    .description('get a password by its name')
    .action((name, field) => {
        // Try to get access token from gnome keyring
        return keytar.getPassword('zoho-vault', 'default').then(token => {
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
            console.log(token);
            return axios.get('/api/rest/json/v1/secrets', {
                baseURL: token.api_domain,
                params: {
                    secretName: name
                }, 
                headers: {
                    'Authorization': `${token.token_type} ${token.access_token}`
                }
            }).then(response => {
                console.log(response.data);
                // return response.data.
            });
        }).catch(err => {
            console.error('Unable to recover from error', err);
        });
    });

program.parse(process.argv);