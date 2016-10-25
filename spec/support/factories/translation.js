const Translation = require('../../../server/models/translation');

factory.define('translation', Translation, {
  locale: 'en',
  sourceUrl: 'http://www.source.url',
  user: factory.assoc('user', 'id')
});
