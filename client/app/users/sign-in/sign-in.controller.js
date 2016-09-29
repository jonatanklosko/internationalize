(() => {
  angular.module('app.users')
    .controller('SignInController', SignInController);

  function SignInController($scope, authService, $state, $mdToast) {
    'ngInject';

    $scope.signIn = credentials => {
      authService.signIn(credentials)
        .then(() => $state.go('root'))
        .catch(error => {
          $mdToast.show(
            $mdToast.simple()
              .textContent(error)
              .position('top right')
              .parent(angular.element(document.getElementById('view-container')))
          );
        });
    };
  }
})();
