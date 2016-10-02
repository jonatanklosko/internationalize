describe('Sign up', () => {
  let form = element(by.tagName('form'));

  beforeEach(() => {
    browser.get('/#/signup');
  });

  it('when the data is valid, signs the user in', () => {
    factory.attrs('user')
      .then(user => helpers.submitForm(form, user));

    helpers.expectUserToBeSignedIn();
  });

  it('when the data is invalid, shows error messages', () => {
    factory.attrs('user', { username: '', passwordConfirmation: 'wrong' })
      .then(user => helpers.submitForm(form, user));

    expect(form).toHaveContent('Username is required');
    expect(form).toHaveContent('Password confirmation must match password');
  });
});
