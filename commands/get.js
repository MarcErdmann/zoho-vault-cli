require('dotenv').config();

const axios = require('axios');
const program = require('commander');
const crypto = require('crypto');
const dayjs = require('dayjs');
const inquirer = require('inquirer');
const keytar = require('keytar');

const login = require('../login');

const state = {
    passsword: undefined,
    token: undefined,
    masterkey: undefined,
    orgkey: undefined
};

program
    .command('get <name> <field>')
    .option('-f, --force', 'enforce a relogin')
    .description('get a password by its name')
    .action((name, field, options) => {
        // Ask for password
        return inquirer.prompt([{
            type: 'password',
            name: 'password',
            message: 'Enter your Password'
        }]).then(answers => {
            state.password = answers.password;
            // Try to get access token from gnome keyring
            return keytar.getPassword('zoho-vault', 'default');
        }).then(token => {
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
            state.token = token;
            // Save current token to gnome keyring
            return keytar.setPassword('zoho-vault', 'default', JSON.stringify(token));
        }).then(() => {
            // Get login data
            return axios.get('/api/json/login', {
                baseURL: 'https://vault.zoho.com',
                params: {
                    OPERATION_NAME: 'GET_LOGIN'
                },
                headers: {
                    'Authorization': `${state.token.token_type} ${state.token.access_token}`
                }
            });
        }).then(response => {
            // Check if call successful
            if (response.data.operation.result.status.toLowerCase() != 'success') process.exit(9);

            // Calculate masterkey
            return crypto.pbkdf2Sync(state.password, response.data.operation.details.SALT, response.data.operation.details.ITERATION, 32, 'sha1');
        }).then(masterkey => {
            state.masterkey = masterkey;

            // Get personal and sharing keys
            return axios.get('/api/json/login', {
                baseURL: 'https://vault.zoho.com',
                params: {
                    OPERATION_NAME: 'OPEN_VAULT',
                    limit: 0
                },
                headers: {
                    'Authorization': `${state.token.token_type} ${state.token.access_token}`
                }
            });
        }).then(response => {
            // Check if call successful
            if (response.data.operation.result.status.toLowerCase() != 'success') process.exit(9);

            // Calculate orgkey
            if (response.data.operation.details.PRIVATEKEY && response.data.operation.details.SHARINGKEY) {
                return crypto(crypto.privateDecrypt(state.masterkey, Buffer.from(response.data.operation.details.PRIVATEKEY), 'hex'), Buffer.from(response.data.operation.details.SHARINGKEY, 'hex'));
            }
        }).then(orgkey => {
            state.orgkey = orgkey;
        }).then(() => {
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
                    'Authorization': `${state.token.token_type} ${state.token.access_token}`
                }
            });
        }).then(response => {
            // Check if password is present
            if (response.data.operation.result.status.toLowerCase() != 'success') process.exit(10);
            if (!response.data.operation.Details || response.data.operation.Details.length < 1) process.exit(11);

            return JSON.parse(response.data.operation.Details[0].secretData);
        }).then(secret => {
            // Check if field is present
            if (!secret[field]) process.exit(12);

            console.log(crypto.privateDecrypt(state.masterkey, Buffer.from(secret[field], 'hex')));
        }).catch(err => {
            console.log(err);
            process.exit(1);
        });
    });
