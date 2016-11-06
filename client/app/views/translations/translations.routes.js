import translationsNewTemplate from './new/new.view.html';
import translationsListTemplate from './list/list.view.html';
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
      template: `
        <div>
          <md-nav-bar nav-bar-aria-label="Translation menu">
            <md-nav-item name="translate" md-nav-sref="translations.show.translate">Translate</md-nav-item>
            <md-nav-item name="browse" md-nav-sref="translations.show.browse">Browse</md-nav-item>
          </md-nav-bar>
          <ui-view></ui-view>
        </div>
      `
    })
    .state('translations.show.translate', {
      url: '/translate',
      template: translationsTranslateTemplate,
      controller: 'TranslationsTranslateController',
      controllerAs: 'vm',
      resolve: {
        translation: (TranslationService, $stateParams) => {
          'ngInject';
          return TranslationService.getTranslation($stateParams.translationId);
        }
      }
    })
    .state('translations.show.browse', {
      url: '/browse',
      template: translationsBrowseTemplate,
      controller: 'TranslationsBrowseController',
      controllerAs: 'vm',
      resolve: {
        translation: (TranslationService, $stateParams) => {
          'ngInject';
          return TranslationService.getTranslation($stateParams.translationId);
        }
      }
    });
};
