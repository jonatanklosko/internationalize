import angular from 'angular';
import uiRouter from 'angular-ui-router';
import highlightJs from 'angular-highlightjs';
import ngClipboard from 'angular-clipboard';

import routing from './translations.routes';

import TranslationsNewController from './new/new.controller';
import TranslationsEditController from './edit/edit.controller';
import TranslationsListController from './list/list.controller';
import TranslationsShowController from './show/show.controller';
import TranslationsTranslateController from './show/translate/translate.controller';
import TranslationsBrowseController from './show/browse/browse.controller';

import './partials/translation-form-fields.partial.html';

export default angular
  .module('app.views.translations', [uiRouter, highlightJs, ngClipboard.name])
  .config(routing)
  .controller('TranslationsNewController', TranslationsNewController)
  .controller('TranslationsEditController', TranslationsEditController)
  .controller('TranslationsListController', TranslationsListController)
  .controller('TranslationsTranslateController', TranslationsTranslateController)
  .controller('TranslationsBrowseController', TranslationsBrowseController)
  .controller('TranslationsShowController', TranslationsShowController)
  .name;
