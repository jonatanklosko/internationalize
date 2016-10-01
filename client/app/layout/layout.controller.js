(() => {
  angular.module('app.layout')
    .controller('LayoutController', LayoutController);

  function LayoutController($scope, authService, $state) {
    'ngInject';

    authService.watchUser(user => $scope.user = user);

    $scope.signOut = () => {
      authService.signOut().then(() => $state.go('root'));
    };
  }
})();
