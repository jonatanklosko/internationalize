const factory = require('../../support/factory');
['attrs', 'attrsMany', 'build', 'buildMany', 'create', 'createMany'].forEach(methodName => {
  let method = factory[methodName];
  factory[methodName] = function() {
    /* Add the promise returned by the factory method to the protractor control flow. */
    return browser.controlFlow().execute(() => method.apply(factory, arguments));
  };
});

module.exports = factory;
