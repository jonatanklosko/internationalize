import angular from 'angular';

import AuthService from './auth.service';
import UserService from './user.service';
import TranslationService from './translation.service';
import TranslationUtils from './translation-utils.service';

export default angular
  .module('app.services', [])
  .service('AuthService', AuthService)
  .service('UserService', UserService)
  .service('TranslationService', TranslationService)
  .service('TranslationUtils', TranslationUtils)
  .name;
