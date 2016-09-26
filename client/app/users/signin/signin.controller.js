(() => {
  angular.module('app.users')
    .controller('SigninController', SigninController);

  function SigninController($scope, authService, $state) {
    'ngInject';

    $scope.signin = credentials => {
      authService.signIn(credentials)
        .then(() => {
          $scope.error = null;
          alert('Signed in!');
        })
        .catch(error => $scope.error = error);
    };
  }
})();
