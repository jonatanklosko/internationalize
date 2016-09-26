(() => {
  angular.module('app.users')
    .controller('SignInController', SignInController);

  function SignInController($scope, authService, $state) {
    'ngInject';

    $scope.signIn = credentials => {
      authService.signIn(credentials)
        .then(() => {
          $scope.error = null;
          alert('Signed in!');
        })
        .catch(error => $scope.error = error);
    };
  }
})();
