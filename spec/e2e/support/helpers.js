class Helpers {
  submitForm(form, fields, data) {
    fields.forEach(field => form.element(by.name(field)).sendKeys(data[field]));
    form.element(by.css('button[type="submit"]')).click();
  }

  signIn(userPromise = factory.create('user')) {
    browser.get('/signin');
    let form = element(by.tagName('form'));
    userPromise
      .then(user => this.currentUser = user)
      .then(user => this.submitForm(form, ['username', 'password'], user));
    browser.waitForAngular(); /* Wait for an http response with the user data. */
  }

  expectToastToContain(message) {
    let toast = $('md-toast');
    /* See: https://github.com/angular/material/issues/8357#issuecomment-248948979 */
    browser.ignoreSynchronization = true;
    browser.wait(protractor.ExpectedConditions.presenceOf(toast))
      .then(() => {
        expect(toast).toHaveContent(message);
        browser.ignoreSynchronization = false;
      });
  }

  expectUserToBeSignedIn() {
    expect(element(by.clickableText('Sign out')).isDisplayed()).toBeTruthy();
    expect(element(by.clickableText('Sign in')).isDisplayed()).toBeFalsy();
  }

  expectUserToBeSignedOut() {
    expect(element(by.clickableText('Sign in')).isDisplayed()).toBeTruthy();
    expect(element(by.clickableText('Sign out')).isDisplayed()).toBeFalsy();
  }

  expectPathToEqual(path) {
    expect(browser.getCurrentUrl()).toEqual(browser.baseUrl + path);
  }
}

module.exports = new Helpers();
