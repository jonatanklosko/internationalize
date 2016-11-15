import template from './translation-box.template.html';

/**
 * translation-box
 *
 * Displays a form meant for translating a single translation key.
 * Attributes:
 *  - processedObject - a processed translation object having _original and _translated keys
 *  - onSubmit - a callback called when the form is submitted and valid
 * Note: the given processedObject is modified when the form is submitted and valid.
 */
export default () => {
  return {
    restrict: 'E',
    template: template,
    scope: {
      processedObject: '=',
      onSubmit: '&'
    },
    controllerAs: 'vm',
    controller: class TranslationBoxController {
      constructor($scope, TranslationUtils) {
        'ngInject';

        this.TranslationUtils = TranslationUtils;

        $scope.$watch('processedObject', processedObject => {
          this.processedObject = processedObject;
          this.original = processedObject._original;
          this.translated = processedObject._translated;
        });
        this.onSubmit = $scope.onSubmit;
      }

      submit() {
        let error = this.TranslationUtils.translationError({ _original: this.original, _translated: this.translated });
        if(error) {
          /* Add mongoose-like validation errors in order to reuse mongoose-validations directive. */
          this.errors = { translated: { message: error } };
        } else {
          this.errors = {};
          this.processedObject._translated = this.translated;
          this.onSubmit({ translated: this.translated });
        }
      }
    }
  };
};
