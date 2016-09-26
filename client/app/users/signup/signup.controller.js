(() => {
  angular.module('app.users')
    .controller('SignupController', SignupController);

  SignupController.$inject = ['$scope', 'userService', '$state'];

  function SignupController($scope, userService, $state) {
    $scope.user = {};
    $scope.signup = user => {
      userService.create(user)
        .then(() => $state.go('root'))
        .catch(errors => $scope.errors = errors);
    };
  }
})();
