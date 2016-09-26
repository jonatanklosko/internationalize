(() => {
  angular.module('app.users')
    .controller('SignupController', SignupController);

  function SignupController($scope, userService, $state) {
    'ngInject';

    $scope.user = {};
    $scope.signup = user => {
      userService.create(user)
        .then(() => $state.go('root'))
        .catch(errors => $scope.errors = errors);
    };
  }
})();
