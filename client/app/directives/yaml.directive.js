export default () => {
  return {
    restrict: 'E',
    scope: {
      content: '='
    },
    template: '<pre><code></code></pre>',
    link: ($scope, $element) => {
      $element.find('code').text($scope.content);
    }
  };
};
