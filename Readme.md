# Set up
- Make sure you are running Ubuntu and have a webbrowser installed
- `sudo apt install libsecret-1-dev`
- `yarn install` or `npm install`
- Register the CLI as a web client in your Zoho Developer Console. The domain is *localhost:37195* and the allowed callback url is *http://localhost:37195/callback*.
- Provide your client's API key (API_KEY) and secret (API_SECRET) as environment variables or in a .env file.

# Usage
- Run `node index get <secretname> <fieldname>` to get a password from Zoho Vault. This will open a webbrowser and will complete after you granted access.

# Important Information
This CLI will listen on port 37195 shortly to complete the OAuth flow. If this port is blocked, the CLI will not work.
The access token for Zoho Vault will be stored in your Gnome Keyring.