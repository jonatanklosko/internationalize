beforeEach(() => jasmine.addMatchers({
  toHaveContent: () => {
    return {
      compare: (actual, expected) => {
        let result = {};
        result.pass = actual.getText().then(content => {
          const matches = content.match(expected);
          result.message = `Expected "${content}" to ${matches ? 'not' : ''} match "${expected}".`;
          return matches
        });
        return result;
      }
    };
  }
}));
