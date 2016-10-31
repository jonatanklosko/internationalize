const Translation = require('../../../server/models/translation');

factory.define('translation', Translation, {
  name: 'Website i18n',
  locale: 'en',
  sourceUrl: 'http://www.source.url',
  user: factory.assoc('user', 'id'),
  data: { en: { name: 'Name' } }
});
