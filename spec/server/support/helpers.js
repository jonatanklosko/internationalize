/**
 * Helpers meant to be used in Jasmine specs in promise chain.
 */
global.helpers = {
  /**
   * @example
   * getDocumentAsync()
   *   .then(helpers.expectValidationErrorToMatch('isRequired'));
   *
   * @param {String|RegExp}
   * @return {Function} A function taking a document and returning a promise,
   *                    expecting a validation error to match the pattern.
   */
  expectValidationErrorToMatch: pattern => {
    return doc => doc.validate()
      .then(() => fail(`Expected validation error to match '${pattern}', but there was no error.`))
      .catch(error => expect(error).toMatch(pattern));
  },

  /**
   * @example
   * getDocumentAsync()
   *   .then(helpers.expectDocumentToBeValid());
   *
   * @return {Function} A function taking a document and returning a promise,
   *                    expecting no validation errors.
   */
  expectDocumentToBeValid: () => {
    return doc => doc.validate()
      .catch(error => fail(`Expected document to be valid. But got an error: '${error}'.`));
  }
};
