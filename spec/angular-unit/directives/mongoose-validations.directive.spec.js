describe('mongooseValidations directive', () => {
  beforeEach(module('app.directives'));
  beforeEach(module('templates'));

  let $compile,
      $rootScope;

  beforeEach(inject((_$compile_, _$rootScope_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  let form;

  beforeEach(() => {
    form = $compile(`
      <form mongoose-validations errors-source="errors">
        <input type="text" name="name">
      </form>
    `)($rootScope);
  });

  describe('without errors', () => {
    it('does not show errors container', () => {
      let errorsContainer = form.find('.form-errors');
      expect(errorsContainer.is(':visible')).toEqual(false);
    });
  });

  describe('with errors', () => {
    beforeEach(() => {
      $rootScope.errors = {
        name: {
          message: "Name is required"
        }
      };
      $rootScope.$digest();
    });

    it('shows errors container with error messages', () => {
      let errorsContainer = form.find('.form-errors');
      expect(errorsContainer.html()).toContain('Name is required');
    });

    it('adds "invalid" class to the input with name matching an error key', () => {
      let input = form.find('input[name="name"]');
      expect(input.hasClass('invalid')).toEqual(true);
    });

    it('removes "invalid" class from the input when an error disappears', () => {
      $rootScope.errors = {};
      $rootScope.$digest();
      let input = form.find('input[name="name"]');
      expect(input.hasClass('invalid')).toEqual(false);
    });
  });
});
