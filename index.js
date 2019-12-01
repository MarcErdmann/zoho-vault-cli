require('dotenv').config();

const axios = require('axios');
const program = require('commander');
const dayjs = require('dayjs');
const keytar = require('keytar');

const login = require('./login');

program.version('0.0.1');

program
    .command('get <name> <field>')
    .option('-f, --force', 'enforce a relogin')
    .description('get a password by its name')
    .action((name, field, options) => {
        // Try to get access token from gnome keyring
        return keytar.getPassword('zoho-vault', 'default').then(token => {
            if (!token) {
                // login if the token is not available in gnome keyring
                return login();
            } else {
                // otherwise parse the token and check if still valid
                // login if not valid anymore
                token = JSON.parse(token);
                return dayjs().isBefore(token.expires_at) && !options.force ? token : login();
            }
        }).then(token => {
            // Save current token to gnome keyring
            return keytar.setPassword('zoho-vault', 'default', JSON.stringify(token)).then(() => {
                return token;
            });
        }).then(token => {
            console.log(token);
            // Get password from Zoho Vault
            return axios.get('/api/rest/json/v1/secrets', {
                baseURL: 'https://vault.zoho.com',
                params: {
                    secretName: name,
                    isAsc: true,
                    pageNum: 0,
                    rowPerPage: 50
                }, 
                headers: {
                    'Authorization': `${token.token_type} ${token.access_token}`
                }
            });
        }).then(response => {
            // Check if password is present
            if (response.data.operation.result.status != 'Success') process.exit(10);
            if (!response.data.operation.Details || response.data.operation.Details.length < 1) process.exit(11);

            return JSON.parse(response.data.operation.Details[0].secretData);
        }).then(secret => {
            // Check if field is present
            if (!secret[field]) process.exit(12);

            console.log(secret[field]);
        }).catch(err => {
            console.log(err);
            process.exit(1);
        });
    });

program.parse(process.argv);