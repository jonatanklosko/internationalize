import angular from 'angular';

export default ($compile) => {
  'ngInject';

  return {
    restrict: 'A',
    scope: {
      errors: '=errorsSource'
    },
    link: ($scope, $element) => {
      for(let domElement of $element[0].querySelectorAll('[name]')) {
        let input = angular.element(domElement);
        let name = input.attr('name');

        let messageTemplate = `<div class="error-message" md-colors="{color: 'warn-A700'}" ng-show="errors.${name}">
                                 <small>{{ errors.${name}.message }}</small>
                               </div>`;
        let message = $compile(angular.element(messageTemplate))($scope);
        input.after(message);

        let mdInputContainer = input.parent();
        if(mdInputContainer[0].tagName === 'MD-INPUT-CONTAINER') {
          $scope.$watch(`errors.${name}`, error => {
            mdInputContainer.toggleClass('md-input-invalid', !!error);
          });
        }
      }
    }
  };
};
