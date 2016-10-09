import staticPagesTemplate from './home.view.html';

export default ($stateProvider) => {
  'ngInject';

  $stateProvider
    .state('root', {
      url: '/',
      template: staticPagesTemplate
    });
};
