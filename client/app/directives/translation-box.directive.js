import template from './translation-box.template.html';
import * as _ from 'lodash';
import * as jsdiff from 'diff';

/**
 * translation-box
 *
 * Displays a form meant for translating a single translation key.
 * Attributes:
 *  - processedObject - a processed translation object having _original and _translated keys
 *  - onSubmit - a callback called when the form is submitted and valid
 *  - oldProcessedObject - a processed translation object with _original key, to show a diff
 * Note: the given processedObject is modified when the form is submitted and valid.
 */
export default () => {
  return {
    restrict: 'E',
    template: template,
    scope: {
      processedObject: '=',
      onSubmit: '&',
      oldProcessedObject: '='
    },
    transclude: true,
    controllerAs: 'vm',
    controller: class TranslationBoxController {
      constructor($scope, $sce, TranslationUtils) {
        'ngInject';

        this.TranslationUtils = TranslationUtils;

        $scope.$watchGroup(['processedObject', 'oldProcessedObject'], ([processedObject, oldProcessedObject]) => {
          this.processedObject = processedObject;
          this.pluralization = processedObject._pluralization;
          this.original = processedObject._original;
          this.translated = processedObject._translated;
          if (oldProcessedObject && !oldProcessedObject._pluralization) {
            let diff = jsdiff.diffWordsWithSpace(oldProcessedObject._original, processedObject._original);
            let diffStrings = diff.map(part => {
              let span = document.createElement('span');
              span.style.color = part.added ? 'green' : (part.removed ? 'red' : 'initial');
              span.innerText = part.value; // This will escape HTML in the original text.
              return span.outerHTML;
            });
            this.diffHtml = $sce.trustAsHtml(diffStrings.join(''));
          }
        });
        this.onSubmit = $scope.onSubmit;
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

      handleKeyPress() {
        if (event.which === 13) {
          event.preventDefault();
          this.submit();
        }
      }
    }
  };
};
