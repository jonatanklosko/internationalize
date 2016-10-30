import translationsNewTemplate from './new/new.view.html';
import translationsListTemplate from './list/list.view.html';
import translationsTranslateTemplate from './translate/translate.view.html';

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
      controllerAs: 'vm'
    })
    .state('translations.translate', {
      url: '/:translationId',
      template: translationsTranslateTemplate,
      controller: 'TranslationsTranslateController',
      controllerAs: 'vm'
    });
};
