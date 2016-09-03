const fs = require('fs');
const path = require('path');

let controllers = {};
fs.readdirSync(__dirname).forEach(file => {
  if(file !== 'index.js') {
    const controllerName = path.basename(file, '.js');
    controllers[controllerName] = require(`${__dirname}/${controllerName}`);
  }
});

module.exports = controllers;
