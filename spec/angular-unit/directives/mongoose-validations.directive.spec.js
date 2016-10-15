import angular from 'angular';

describe('mongooseValidations directive', () => {
  beforeEach(angular.mock.module('app.directives'));

  let $compile,
      $rootScope;

  beforeEach(angular.mock.inject((_$compile_, _$rootScope_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  let form;

  beforeEach(() => {
    form = $compile(`
      <form mongoose-validations errors-source="errors">
        <md-input-container>
          <input type="text" name="name">
        </md-input-container>
      </form>
    `)($rootScope);
  });

  it('inserts an error container after an input', () => {
    let errorMessage = form.find('input[name="name"] ~ .error-message');
    expect(errorMessage.length).toEqual(1);
  });

  describe('without errors', () => {
    it('does not show error message', () => {
      let errorMessage = form.find('.error-message');
      expect(errorMessage.is(':visible')).toEqual(false);
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

    it('shows the error message', () => {
      let errorsMessage = form.find('.error-message');
      expect(errorsMessage.html()).toContain('Name is required');
    });

    it('adds "md-input-invalid" class to the md-input-container', () => {
      let inputContainer = form.find('md-input-container');
      expect(inputContainer.hasClass('md-input-invalid')).toEqual(true);
    });

    it('removes "md-input-invalid" class from the md-input-container when an error disappears', () => {
      $rootScope.errors = {};
      $rootScope.$digest();
      let inputContainer = form.find('md-input-container');
      expect(inputContainer.hasClass('md-input-invalid')).toEqual(false);
    });
  });
});
