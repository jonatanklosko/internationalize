import translationsNewTemplate from './new/new.view.html';
import translationsEditTemplate from './edit/edit.view.html';
import translationsListTemplate from './list/list.view.html';
import translationsShowTemplate from './show/show.view.html';
import translationsTranslateTemplate from './show/translate/translate.view.html';
import translationsBrowseTemplate from './show/browse/browse.view.html';

export default ($stateProvider) => {
  'ngInject';

  $stateProvider
    .state('translations', {
      abstract: true,
      url: '/translations',
      template: '<ui-view></ui-view>'
    })
    .state('translations.new', {
      url: '/new',
      template: translationsNewTemplate,
      controller: 'TranslationsNewController',
      controllerAs: 'vm'
    })
    .state('translations.edit', {
      url: '/:translationId/edit',
      template: translationsEditTemplate,
      controller: 'TranslationsEditController',
      controllerAs: 'vm',
      resolve: {
        translation: (TranslationService, $stateParams) => {
          'ngInject';
          return TranslationService.getTranslation($stateParams.translationId);
        }
      }
    })
    .state('translations.list', {
      url: '/list',
      template: translationsListTemplate,
      controller: 'TranslationsListController',
      controllerAs: 'vm',
      resolve: {
        translations: (TranslationService) => {
          'ngInject';
          return TranslationService.getAll();
        }
      }
    })
    .state('translations.show', {
      url: '/:translationId',
      abstract: true,
      template: translationsShowTemplate,
      controller: 'TranslationsShowController',
      controllerAs: 'vm',
      resolve: {
        translation: (TranslationService, $stateParams) => {
          'ngInject';
          return TranslationService.getTranslation($stateParams.translationId);
        }
      }
    })
    .state('translations.show.translate', {
      url: '/translate',
      template: translationsTranslateTemplate,
      controller: 'TranslationsTranslateController',
      controllerAs: 'vm'
    })
    .state('translations.show.browse', {
      url: '/browse',
      template: translationsBrowseTemplate,
      controller: 'TranslationsBrowseController',
      controllerAs: 'vm'
    });
};
