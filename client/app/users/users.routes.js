(() => {
  angular.module('app.users')
    .config(config);

  function config($stateProvider) {
    'ngInject';

    $stateProvider
      .state('signUp', {
        url: '/signup',
        templateUrl: 'app/users/sign-up/sign-up.template.html',
        controller: 'SignUpController'
      })
      .state('signIn', {
        url: '/signin',
        templateUrl: 'app/users/sign-in/sign-in.template.html',
        controller: 'SignInController'
      });
  }
})();
