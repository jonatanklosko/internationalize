import template from './translation-box.template.html';
import * as _ from 'lodash';

/**
 * translation-box
 *
 * Displays a form meant for translating a single translation key.
 * Attributes:
 *  - processedObject - a processed translation object having _original and _translated keys
 *  - onSubmit - a callback called when the form is submitted and valid
 *  - originalTitle - a text to display before the original phrase
 * Note: the given processedObject is modified when the form is submitted and valid.
 */
export default () => {
  return {
    restrict: 'E',
    template: template,
    scope: {
      processedObject: '=',
      onSubmit: '&',
      originalTitle: '@'
    },
    transclude: true,
    controllerAs: 'vm',
    controller: class TranslationBoxController {
      constructor($scope, TranslationUtils) {
        'ngInject';

        this.TranslationUtils = TranslationUtils;

        $scope.$watch('processedObject', processedObject => {
          this.processedObject = processedObject;
          this.pluralization = processedObject._pluralization;
          this.original = processedObject._original;
          this.translated = processedObject._translated;
        });
        this.onSubmit = $scope.onSubmit;
        this.originalTitle = $scope.originalTitle || 'Original';
      }

      submit() {
        this.errors = {};
        /* Add mongoose-like validation errors in order to reuse mongoose-validations directive. */
        if(this.pluralization) {
          _.each(this.translated, (translated, key) => {
            let error = this.TranslationUtils.translationError('', translated, { variables: false });
            if(error) this.errors[`translated_${key}`] = { message: error };
          });
        } else {
          let error = this.TranslationUtils.translationError(this.original, this.translated);
          if(error) this.errors['translated'] = { message: error };
        }
        if(_.isEmpty(this.errors)) {
          this.processedObject._translated = this.translated;
          this.onSubmit();
        }
      }
    }
  };
};
