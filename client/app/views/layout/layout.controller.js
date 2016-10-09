export default class LayoutController {
  constructor(AuthService, $state) {
    'ngInject';

    this.AuthService = AuthService;
    this.$state = $state;

    this.AuthService.watchUser(user => this.user = user);
  }

  signOut() {
    this.AuthService.signOut().then(() => this.$state.go('root'));
  }
}
