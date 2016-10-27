import newTranslationTemplate from './new/new.view.html';
import translationsListTemplate from './list/list.view.html';

export default ($stateProvider) => {
  'ngInject';

  $stateProvider
    .state('newTranslation', {
      url: '/translations/new',
      template: newTranslationTemplate,
      controller: 'NewTranslationController',
      controllerAs: 'vm'
    })
    .state('translationsList', {
      url: '/translations',
      template: translationsListTemplate,
      controller: 'TranslationsListController',
      controllerAs: 'vm'
    });
};
