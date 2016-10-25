import angular from 'angular';

import layout from './layout';
import staticPages from './static-pages';
import users from './users';
import translations from './translations';

export default angular
  .module('app.views', [
    layout,
    staticPages,
    users,
    translations
  ])
  .name;
