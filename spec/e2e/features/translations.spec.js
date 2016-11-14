let page = element(by.tagName('html'));
let form = element(by.tagName('form'));
let dialog = element(by.tagName('md-dialog'));

beforeEach(() => helpers.signIn());

describe('Creating a new translation', () => {
  let form = element(by.tagName('form'));

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

describe('Deleting a new translation', () => {
  it('a user goes to his translations list and clicks a delete link', () => {
    factory.create('translation', { name: 'A translation to remove', user: helpers.currentUser.id });
    browser.get('/translations/list');

    element(by.css('[aria-label="Delete"]')).click();
    element(by.buttonText('Yes')).click();
    expect(page).not.toHaveContent('A translation to remove');
  });
});

let createTranslation = () => {
  browser.get('/translations/new');
  factory.attrs('translation', { name: 'My translation' })
    .then(translation => helpers.submitForm(form, ['name', 'locale', 'sourceUrl'], translation));
  browser.waitForAngular(); /* Wait until the remote data is fetched and pushed to the server. */
  browser.get('/translations/list');
  element(by.cssContainingText('md-list-item', 'My translation')).click();
};

describe('Translating a translation', () => {
  it('a user goes to his translation page and translates the given phrases', () => {
    createTranslation();

    form.element(by.name('translated')).sendKeys('First translation');
    form.submit();
    expect(page).toHaveContent('1/2');

    form.element(by.name('translated')).sendKeys('Second translation');
    form.submit();
    expect(page).toHaveContent('2/2');

    expect(page).toHaveContent('Everything translated');

    element(by.css('[aria-label="Open translation interactions menu"]')).click();
    element(by.partialButtonText('Show raw')).click();
    expect(dialog).toHaveContent('First translation');
    expect(dialog).toHaveContent('Second translation');
  });
});

describe('Browsing a translation', () => {
  it('a user goes to his translation page and browses his translation data', () => {
    createTranslation();

    element(by.clickableText('Browse')).click();
    element(by.cssContainingText('md-list-item', 'en')).click();
    element(by.cssContainingText('md-list-item', 'common')).click();
    element(by.cssContainingText('md-list-item', 'name')).click();
    form.element(by.name('translated')).sendKeys('Nom');
    form.submit();

    element(by.css('[aria-label="Open translation interactions menu"]')).click();
    element(by.clickableText('Show raw')).click();
    expect(dialog).toHaveContent('name: Nom');
  });
});
