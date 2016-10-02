const fs = require('fs');
const factoryGirl = require('factory-girl');

global.factory = factoryGirl.factory;
factory.setAdapter(new factoryGirl.MongooseAdapter());

fs.readdirSync(`${__dirname}/factories`).forEach(file => {
  require(`${__dirname}/factories/${file}`);
});

module.exports = factory;
