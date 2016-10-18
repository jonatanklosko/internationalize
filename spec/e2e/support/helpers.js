class Helpers {
  submitForm(form, data) {
    for(const name in data) {
      form.element(by.name(name)).sendKeys(data[name]);
    }
    form.element(by.css('button[type="submit"]')).click();
  }

  signIn(userPromise = factory.create('user')) {
    browser.get('/signin');
    let form = element(by.tagName('form'));
    userPromise.then(user => this.submitForm(form, { username: user.username, password: user.password }));
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
}

module.exports = new Helpers();
