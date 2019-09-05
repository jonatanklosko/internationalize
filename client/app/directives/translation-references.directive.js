import * as _ from 'lodash';
import template from './translation-references.template.html';

/**
 * translation-references
 *
 * Displays a list of references (both original and translated phrase for each reference).
 */
export default () => {
  return {
    restrict: 'E',
    template: template,
    scope: {
      chain: '=',
      data: '='
    },
    controllerAs: 'vm',
    controller: class TranslationReferencesController {
      constructor($scope) {
        'ngInject';
        $scope.$watchCollection('chain', chain => {
          this.referenceValues = chain
            .reduce((references, obj) =>
              obj.data._references
                ? references.concat(obj.data._references)
                : references
            , [])
            .map(reference =>
              /* Reference is a dot-separated key (without the root language key). */
              _.get($scope.data, reference)
            );
        });
      }
    }
  };
};
