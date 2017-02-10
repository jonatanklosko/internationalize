export default class SignInController {
  constructor(AuthService, $state, ToastService) {
    'ngInject';

    this.AuthService = AuthService;
    this.$state = $state;
    this.ToastService = ToastService;
  }

  signIn(credentials) {
    this.AuthService.signIn(credentials)
      .then(() => this.$state.go('root'))
      .catch(error => this.ToastService.simpleToast(error));
  }
}
