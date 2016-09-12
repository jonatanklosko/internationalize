(() => {
  angular.module('app.directives')
    .directive('mongooseValidations', mongooseValidations);

  function mongooseValidations() {
    return {
      restrict: 'A',
      transclude: true,
      templateUrl: 'app/shared/directives/mongoose-validations.template.html',
      scope: {
        errors: '=errorsSource'
      },
      link: function($scope, $element) {
        $scope.$watch('errors', (errors, oldErrors) => {
          for(let field in Object.assign({}, errors, oldErrors)) {
            let formElement = angular.element($element[0].querySelectorAll(`[name="${field}"]`));
            if(errors[field]) {
              formElement.addClass('invalid');
            } else {
              formElement.removeClass('invalid');
            }
          }
        });
      }
    };
  }
})();
