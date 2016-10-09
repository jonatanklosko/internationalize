import angular from 'angular';

import mongooseValidations from './mongoose-validations.directive';

export default angular
  .module('app.directives', [])
  .directive('mongooseValidations', mongooseValidations)
  .name;
