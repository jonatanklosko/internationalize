const Translation = require('../../../server/models/translation');

factory.define('translation', Translation, {
  name: 'Website i18n',
  baseLocale: 'en',
  targetLocale: 'fr',
  baseUrl: `${process.env.EXTERNAL_FILES_URL}/en.yml`,
  targetUrl: `${process.env.EXTERNAL_FILES_URL}/fr.yml`,
  user: factory.assoc('user', 'id'),
  data: { en: { name: 'Name' } }
});
