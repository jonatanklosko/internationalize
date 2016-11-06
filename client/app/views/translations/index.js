import angular from 'angular';
import uiRouter from 'angular-ui-router';
import highlightJs from 'angular-highlightjs';
import ngClipboard from 'angular-clipboard';

import routing from './translations.routes';

import TranslationsNewController from './new/new.controller';
import TranslationsListController from './list/list.controller';
import TranslationsTranslateController from './show/translate/translate.controller';
import TranslationsBrowseController from './show/browse/browse.controller';

export default angular
  .module('app.views.translations', [uiRouter, highlightJs, ngClipboard.name])
  .config(routing)
  .controller('TranslationsNewController', TranslationsNewController)
  .controller('TranslationsListController', TranslationsListController)
  .controller('TranslationsTranslateController', TranslationsTranslateController)
  .controller('TranslationsBrowseController', TranslationsBrowseController)
  .name;
