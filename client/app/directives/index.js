import angular from 'angular';
import ngMaterial from 'angular-material';

import mongooseValidations from './mongoose-validations.directive';
import translationBox from './translation-box.directive';
import translationContext from './translation-context.directive';
import translationReferences from './translation-references.directive';
import yaml from './yaml.directive';

export default angular
  .module('app.directives', [ngMaterial])
  .directive('mongooseValidations', mongooseValidations)
  .directive('translationBox', translationBox)
  .directive('translationContext', translationContext)
  .directive('translationReferences', translationReferences)
  .directive('yaml', yaml)
  .name;
