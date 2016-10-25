import angular from 'angular';
import uiRouter from 'angular-ui-router';

import routing from './translations.routes';

import NewTranslationController from './new/new.controller';

export default angular
  .module('app.views.translations', [uiRouter])
  .config(routing)
  .controller('NewTranslationController', NewTranslationController)
  .name;
