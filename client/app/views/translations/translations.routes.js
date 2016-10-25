import newTranslationTemplate from './new/new.view.html';

export default ($stateProvider) => {
  'ngInject';

  $stateProvider
    .state('newTranslation', {
      url: '/translations/new',
      template: newTranslationTemplate,
      controller: 'NewTranslationController',
      controllerAs: 'vm'
    });
};
