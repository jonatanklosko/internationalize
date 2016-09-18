(() => {
  angular.module('app.users')
    .controller('SigninController', SigninController);

  SigninController.$inject = ['$scope', 'authService', '$state'];

  function SigninController($scope, authService, $state) {
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
