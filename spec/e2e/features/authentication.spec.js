describe('Sign in', () => {
  it('when the credentials are valid, signs the user in', () => {
    helpers.signIn();
    helpers.expectUserToBeSignedIn();
  });

  it('when the credentials are invalid, shows appropriate error', () => {
    browser.get('/signin');
    let form = element(by.tagName('form'));
    helpers.submitForm(form, { username: 'nonexistent', password: 'password' });

    helpers.expectToastToContain('Incorrect username');
  });
});

describe('Sign out', () => {
  it('redirects to the root url', () => {
    helpers.signIn();
    element(by.clickableText('Sign out')).click();

    helpers.expectUserToBeSignedOut();
    helpers.expectPathToEqual('/');
  });
});
