import angular from 'angular';

export default class SignInController {
  constructor(AuthService, $state, $mdToast) {
    'ngInject';

    this.AuthService = AuthService;
    this.$state = $state;
    this.$mdToast = $mdToast;
  }

  signIn(credentials) {
    this.AuthService.signIn(credentials)
      .then(() => this.$state.go('root'))
      .catch(error => {
        this.$mdToast.show(
          this.$mdToast.simple()
            .textContent(error)
            .position('top right')
            .parent(angular.element(document.getElementById('view-container')))
          );
      });
  }
}
