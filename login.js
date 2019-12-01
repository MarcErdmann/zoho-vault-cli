const axios = require('axios');
const dayjs = require('dayjs');
const express = require('express');
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
                    // scope: 'ZohoVault.user.READ,ZohoVault.secrets.READ,AaaServer.profile.READ',
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

        open(`https://accounts.zoho.com/oauth/v2/auth?client_id=${process.env.API_KEY}&response_type=code&redirect_uri=http://localhost:37195/callback&scope=ZohoVault.user.READ,ZohoVault.secrets.READ,AaaServer.profile.READ`);
    });
}

module.exports = login;