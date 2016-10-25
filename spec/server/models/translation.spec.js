const User = require('models/user');

describe('Translation', () => {
  it('has a working factory', () => {
    return factory.build('translation')
      .then(helpers.expectDocumentToBeValid());
  });

  describe('user', () => {
    let translation;

    beforeEach(() => {
      return factory.create('translation')
        .then(doc => doc.populate('user').execPopulate())
        .then(doc => translation = doc);
    });

    it('when a translation is created, is added to his translations', () => {
      expect(translation.user.translations.length).toEqual(1);
    });

    it('when a translation is deleted, is removed from his translations', () => {
      return translation.remove()
        .then(removedTranslation => User.findById(removedTranslation.user))
        .then(user => expect(user.translations.length).toEqual(0));
    });

    it('when a translation is updated, his translations count doesn\'t change', () => {
      translation.locale = 'fr';
      return translation.save()
        .then(translation => User.findById(translation.user))
        .then(user => expect(user.translations.length).toEqual(1));
    });
  });
});
