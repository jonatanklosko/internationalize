import angular from 'angular';

import AuthService from './auth.service';
import UserService from './user.service';
import TranslationService from './translation.service';

export default angular
  .module('app.services', [])
  .service('AuthService', AuthService)
  .service('UserService', UserService)
  .service('TranslationService', TranslationService)
  .name;
