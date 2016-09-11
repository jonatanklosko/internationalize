(() => {
  angular.module('app.users')
    .controller('SignupController', SignupController);

  SignupController.$inject = ['$scope', 'usersService', '$state'];

  function SignupController($scope, usersService, $state) {
    $scope.user = {};
    $scope.signup = user => {
      usersService.create(user)
        .success(() => $state.go('root'))
        .error(console.log.bind(console));
    };
  }
})();
