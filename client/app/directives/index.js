import angular from 'angular';
import ngMaterial from 'angular-material';

import mongooseValidations from './mongoose-validations.directive';
import translationBox from './translation-box.directive';
import translationContext from './translation-context.directive';

export default angular
  .module('app.directives', [ngMaterial])
  .directive('mongooseValidations', mongooseValidations)
  .directive('translationBox', translationBox)
  .directive('translationContext', translationContext)
  .name;
