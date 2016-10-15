export default ($compile) => {
  'ngInject';

  return {
    restrict: 'A',
    scope: {
      errors: '=errorsSource'
    },
    link: ($scope, $element) => {
      $element.find('[name]').each((i, element) => {
        let input = $(element);
        let name = input.attr('name');

        let messageTemplate = `<div class="error-message" md-colors="{color: 'warn-A700'}" ng-show="errors.${name}">
                                 <small>{{ errors.${name}.message }}</small>
                               </div>`;
        let message = $compile($(messageTemplate))($scope);
        input.after(message);

        let mdInputContainer = input.parent('md-input-container');
        if(mdInputContainer.length) {
          $scope.$watch(`errors.${name}`, error => {
            mdInputContainer.toggleClass('md-input-invalid', !!error);
          });
        }
      });
    }
  };
};
