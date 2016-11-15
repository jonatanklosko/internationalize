import angular from 'angular';

import mongooseValidations from './mongoose-validations.directive';
import translationBox from './translation-box.directive';

export default angular
  .module('app.directives', [])
  .directive('mongooseValidations', mongooseValidations)
  .directive('translationBox', translationBox)
  .name;
