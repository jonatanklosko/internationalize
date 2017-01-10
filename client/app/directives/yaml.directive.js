import prism from 'prismjs/components/prism-core';
import 'prismjs/components/prism-yaml';

export default () => {
  return {
    restrict: 'E',
    scope: {
      content: '='
    },
    template: '<pre><code></code></pre>',
    link: ($scope, $element) => {
      let highlighted = prism.highlight($scope.content, prism.languages.yaml);
      $element.find('code').html(highlighted);
    }
  };
};
