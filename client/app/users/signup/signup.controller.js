(() => {
  angular.module('app.users')
    .controller('SignupController', SignupController);

  SignupController.$inject = ['$scope', 'authService', '$state'];

  function SignupController($scope, authService, $state) {
    $scope.user = {};
    $scope.signup = user => {
      authService.signUp(user)
        .then(() => $state.go('root'))
        .catch(errors => $scope.errors = errors);
    };
  }
})();
