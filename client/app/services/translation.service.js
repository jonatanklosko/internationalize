export default class TranslationService {
  constructor($http, $q, AuthService, TranslationUtils) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
    this.AuthService = AuthService;
    this.TranslationUtils = TranslationUtils;
  }

  /**
   * Creates a new translation.
   * Processes and saves a data fetched from its translationUrl.
   *
   * @param {Object} translationAttributes New translation attributes.
   * @return {Promise} Resolved with the translation or rejected with validation errors.
   */
  create(translationAttributes) {
    let translation;
    return this.currentUserTranslationsRequest('post', '', translationAttributes)
      .then(res => translation = res.data.translation)
      /* When the translation is saved, thus has a valid sourceUrl,
         fetch the remote data, process it and update the translation. */
      .then(() => this.TranslationUtils.pullRemoteData(translationAttributes.sourceUrl, translationAttributes.baseLocale))
      .then(({ newData }) => this.update(translation._id, Object.assign(translation, { data: newData })))
      .then(() => translation)
      .catch(res => this.$q.reject(res.data.errors));
  }

  /**
   * @return {Promise} Resolved with all translations which belong to the current user.
   */
  getAll() {
    return this.currentUserTranslationsRequest('get')
      .then(res => res.data.translations);
  }

  /**
   * @param {String} translationId Id of the translation to load.
   * @return {Promise} Resolved with the translation data.
   */
  getTranslation(translationId) {
    return this.currentUserTranslationsRequest('get', `/${translationId}`)
      .then(res => res.data.translation);
  }

  /**
   * @param {String} translationId Id of the translation to delete.
   * @return {Promise} Resolved when the translation is deleted.
   */
  delete(translationId) {
    return this.currentUserTranslationsRequest('delete', `/${translationId}`);
  }

  /**
   * @param {String} translationId Id of the translation to be updated.
   * @param {Object} translationAttributes Updated translation attributes.
   * @return {Promise} Resolved when the translation is updated.
   */
  update(translationId, translationAttributes) {
    return this.currentUserTranslationsRequest('patch', `/${translationId}`, translationAttributes)
      .catch(res => this.$q.reject(res.data.errors));
  }

  /**
   * @param {String} translationId An id of a translation.
   * @param {String} keyId An id of the key to be updated.
   * @param {String} value A new value of the key.
   * @return {Promise} Resolved when the key is updated.
   */
  updateKey(translationId, keyId, value) {
    return this.currentUserTranslationsRequest('patch', `/${translationId}/keys/${keyId}`, { value });
  }

  currentUserTranslationsRequest(method, path = '', data = {}) {
    return this.AuthService.currentUser()
      .then(user => this.$http({ method, url: `/api/users/${user._id}/translations${path}`, data }));
  }
}
