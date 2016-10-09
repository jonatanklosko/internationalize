import signUpTemplate from './sign-up/sign-up.view.html';
import signInTemplage from './sign-in/sign-in.view.html';

export default ($stateProvider) => {
  'ngInject';

  $stateProvider
    .state('signUp', {
      url: '/signup',
      template: signUpTemplate,
      controller: 'SignUpController',
      controllerAs: 'vm'
    })
    .state('signIn', {
      url: '/signin',
      template: signInTemplage,
      controller: 'SignInController',
      controllerAs: 'vm'
    });
};
