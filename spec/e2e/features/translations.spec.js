let page = element(by.tagName('html'));
let form = element(by.tagName('form'));
let dialog = element(by.tagName('md-dialog'));
let translationMenu = element(by.css('[aria-label="Open translation interactions menu"]'));
let formAttributes = ['name', 'baseLocale', 'targetLocale', 'baseUrl'];

let createTranslation = () => {
  browser.get('/translations/new');
  factory.attrs('translation', { name: 'My translation' })
    .then(translation => helpers.submitForm(form, formAttributes, translation));
  browser.waitForAngular(); /* Wait until the remote data is fetched, processed and pushed to the server. */
  browser.get('/translations/list');
  element(by.cssContainingText('#view-container md-list-item', 'My translation')).click();
};

beforeEach(() => helpers.signIn());

describe('Creating a new translation', () => {
  describe('a user goes to the new translation page and fills the form', () => {
    beforeEach(() => browser.get('/translations/new'));

    it('with valid informations', () => {
      factory.attrs('translation', { name: 'My new translation' })
        .then(translation => helpers.submitForm(form, formAttributes, translation));

      helpers.expectPathToEqual('/translations/list');
      expect(page).toHaveContent('My new translation');
      expect(element.all(by.repeater('translation in vm.translations')).count()).toEqual(1);
    });

    it('with invalid informations', () => {
      factory.attrs('translation', { name: '', baseUrl: 'invalid' })
        .then(translation => helpers.submitForm(form, formAttributes, translation));

      expect(form).toHaveContent('Name is required');
      expect(form).toHaveContent('Base URL must lead to a valid YAML document');
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

describe('Translating a translation', () => {
  it('a user goes to his translation page and translates the given phrases', () => {
    createTranslation();

    form.element(by.name('translated')).sendKeys('Nom');
    form.submit();
    expect(page).toHaveContent('1/3');

    form.element(by.name('translated')).sendKeys('Salut');
    form.submit();
    expect(page).toHaveContent('2/3');

    form.element(by.name('translated')).sendKeys('Ici');
    form.submit();
    expect(page).toHaveContent('3/3');

    expect(page).toHaveContent('Everything translated');

    translationMenu.click();
    element(by.partialButtonText('Show raw')).click();
    expect(dialog).toHaveContent('name: Nom');
    expect(dialog).toHaveContent('hello: Salut');
    expect(dialog).toHaveContent('here: Ici');
  });
});

describe('Browsing a translation', () => {
  it('a user goes to his translation page and browses his translation data', () => {
    createTranslation();

    element(by.clickableText('Browse')).click();
    element(by.cssContainingText('md-list-item', 'common')).click();
    element(by.cssContainingText('md-list-item', 'name')).click();
    form.element(by.name('translated')).sendKeys('Nom');
    form.submit();

    translationMenu.click();
    element(by.clickableText('Show raw')).click();
    expect(dialog).toHaveContent('name: Nom');
  });
});

describe('Synchronizing with a remote', () => {
  it('a user goes to his translation page, synchronizes with the remote and solves any possible conflicts', () => {
    createTranslation();

    /* Simulate a change in the remote files by changing the urls.
       Look at specs/support/files/* to understand the things happening below. */
    translationMenu.click();
    element(by.clickableText('Edit')).click();
    form.element(by.name('baseUrl')).clear().sendKeys(`${process.env.EXTERNAL_FILES_URL}/en-updated.yml`);
    form.element(by.name('targetUrl')).clear().sendKeys(`${process.env.EXTERNAL_FILES_URL}/fr.yml`);
    form.element(by.clickableText('Save')).click();

    /* Translate the 'common.name' and 'common.hello' keys. */
    form.element(by.name('translated')).sendKeys('Nom');
    form.submit();
    form.element(by.name('translated')).sendKeys('Salut');
    form.submit();

    translationMenu.click();
    element(by.clickableText('Synchronize with the remote')).click();

    /* The 'common.name' key is translated but is no longer needed. */
    expect(dialog).toHaveContent('1 translated key is unused and will be removed');
    /* The original text of the 'common.hello' key has changed so we expect a conflict. */
    expect(dialog).toHaveContent(/Resolve conflicts \(1 of 1\)/);

    let conflictsForm = dialog.element(by.tagName('form'));
    conflictsForm.element(by.name('translated')).clear().sendKeys('Salut mon ami!');
    conflictsForm.submit();

    expect(dialog).toHaveContent('1 conflict has been resolved');

    dialog.element(by.clickableText('Synchronize')).click();

    translationMenu.click();
    element(by.clickableText('Show raw')).click();
    expect(dialog).not.toHaveContent('name:');
    expect(dialog).toHaveContent('hello: Salut mon ami!');
    expect(dialog).toHaveContent('here: Ici');
    expect(dialog).toHaveContent('day:');
  });
});
