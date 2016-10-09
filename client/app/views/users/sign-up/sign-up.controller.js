export default class SignUpController {
  constructor(UserService, $state) {
    'ngInject';

    this.UserService = UserService;
    this.$state = $state;

    this.user = {};
    this.errors = {};
  }

  signUp(userData) {
    this.UserService.create(userData)
      .then(() => this.$state.go('root'))
      .catch(errors => this.errors = errors);
  }
}
