beforeEach(() => helpers.signIn());

describe('Creating a new translation', () => {
  let form = element(by.tagName('form'));
  let page = element(by.tagName('html'));

  describe('a user goes to the new translation page and fills the form', () => {
    beforeEach(() => browser.get('/translations/new'));

    it('with valid informations', () => {
      factory.attrs('translation', { name: 'My new translation' })
        .then(translation => helpers.submitForm(form, ['name', 'locale', 'sourceUrl'], translation));

      helpers.expectPathToEqual('/translations/list');
      expect(page).toHaveContent('My new translation');
      expect(element.all(by.repeater('translation in vm.translations')).count()).toEqual(1);
    });

    it('with invalid informations', () => {
      factory.attrs('translation', { name: '', sourceUrl: 'invalid' })
        .then(translation => helpers.submitForm(form, ['name', 'locale', 'sourceUrl'], translation));

      expect(form).toHaveContent('Name is required');
      expect(form).toHaveContent('Source URL must lead to a valid YAML document');
    });
  });
});
