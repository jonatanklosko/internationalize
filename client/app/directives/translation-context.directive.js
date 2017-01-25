import template from './translation-context.template.html';

/**
 * translation-context
 *
 * Displays a list of contextual comments.
 */
export default () => {
  return {
    restrict: 'E',
    template: template,
    scope: {
      chain: '='
    },
    controllerAs: 'vm',
    controller: class TranslationContextController {
      constructor($scope) {
        'ngInject';
        $scope.$watchCollection('chain', chain => {
          this.context = chain.filter(obj => obj.data._context);
        });
      }
    }
  };
};
