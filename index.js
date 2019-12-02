require('dotenv').config();

const program = require('commander');

program.version('0.0.1');

// register all commands
require('./commands/get');

program.parse(process.argv);