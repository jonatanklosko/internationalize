import angular from 'angular';

import layout from './layout';
import staticPages from './static-pages';
import users from './users';

export default angular
  .module('app.views', [
    layout,
    staticPages,
    users
  ])
  .name;
