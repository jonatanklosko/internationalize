export default class LayoutController {
  constructor(AuthService, $state, $mdSidenav) {
    'ngInject';

    this.AuthService = AuthService;
    this.$state = $state;
    this.$mdSidenav = $mdSidenav;

    this.AuthService.watchUser(user => this.user = user);
  }

  toggleMenu() {
    this.$mdSidenav('menu').toggle();
  }

  signOut() {
    this.AuthService.signOut().then(() => this.$state.go('root'));
  }
}
