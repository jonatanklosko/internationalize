import angular from 'angular';
import uiRouter from 'angular-ui-router';

import routing from './users.routes';

import SignUpController from './sign-up/sign-up.controller';
import SignInController from './sign-in/sign-in.controller';

export default angular
  .module('app.views.users', [uiRouter])
  .config(routing)
  .controller('SignUpController', SignUpController)
  .controller('SignInController', SignInController)
  .name;
