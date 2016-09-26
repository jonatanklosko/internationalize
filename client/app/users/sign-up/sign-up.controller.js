(() => {
  angular.module('app.users')
    .controller('SignUpController', SignUpController);

  function SignUpController($scope, userService, $state) {
    'ngInject';

    $scope.user = {};
    $scope.signUp = user => {
      userService.create(user)
        .then(() => $state.go('root'))
        .catch(errors => $scope.errors = errors);
    };
  }
})();
