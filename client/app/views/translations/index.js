import angular from 'angular';
import uiRouter from 'angular-ui-router';

import routing from './translations.routes';

import NewTranslationController from './new/new.controller';
import TranslationsListController from './list/list.controller';

export default angular
  .module('app.views.translations', [uiRouter])
  .config(routing)
  .controller('NewTranslationController', NewTranslationController)
  .controller('TranslationsListController', TranslationsListController)
  .name;
