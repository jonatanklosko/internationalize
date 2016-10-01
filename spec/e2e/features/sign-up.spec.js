describe('Sign up', () => {
  beforeEach(() => {
    browser.get('/');
    element(by.clickableText('Sign up')).click();
  });

  it('when the data is valid, signs the user in', () => {
    let form = element(by.tagName('form'));

    form.element(by.name('username')).sendKeys('sherlock');
    form.element(by.name('name')).sendKeys('Sherlock Holmes');
    form.element(by.name('password')).sendKeys('password');
    form.element(by.name('passwordConfirmation')).sendKeys('password');
    form.element(by.clickableText('Sign up')).click();

    expect(element(by.clickableText('Sign out')).isDisplayed()).toBeTruthy();
  });

  it('when the data is invalid, shows error messages', () => {
    let form = element(by.tagName('form'));

    form.element(by.name('username')).sendKeys('');
    form.element(by.name('name')).sendKeys('Sherlock Holmes');
    form.element(by.name('password')).sendKeys('password');
    form.element(by.name('passwordConfirmation')).sendKeys('something else');
    form.element(by.clickableText('Sign up')).click();

    expect(form.getText()).toMatch('Username is required');
    expect(form.getText()).toMatch('Password confirmation must match password');
  });
});
