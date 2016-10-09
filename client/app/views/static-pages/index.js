import angular from 'angular';
import uiRouter from 'angular-ui-router';

import routing from './static-pages.routes';

export default angular
  .module('app.view.staticPages', [uiRouter])
  .config(routing)
  .name;
