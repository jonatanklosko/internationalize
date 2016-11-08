export default class TranslationService {
  constructor($http, $q, AuthService, TranslationUtils) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
    this.AuthService = AuthService;
    this.TranslationUtils = TranslationUtils;
  }

  /**
   * @param {Object} A new translation data.
   * @return {Promise} Resolved with the translation or rejected with validation errors.
   */
  create(translationData) {
    let translation;
    return this.AuthService.currentUser()
      .then(user => this.$http.post(`/api/users/${user._id}/translations`, translationData))
      .then(res => translation = res.data.translation)
      .then(() => this.TranslationUtils.pullRemoteData(translationData.sourceUrl))
      .then(({ newData }) => this.update(translation._id, Object.assign(translation, { data: newData })))
      .then(() => translation)
      .catch(res => this.$q.reject(res.data.errors));
  }

  /**
   * @return {Promise} Resolved with all translations which belong to the current user.
   */
  getAll() {
    return this.AuthService.currentUser()
      .then(user => this.$http.get(`/api/users/${user._id}/translations`))
      .then(res => res.data.translations);
  }

  /**
   * @param {String} Id of the translation to load.
   * @return {Promise} Resolved with the translation data.
   */
  getTranslation(translationId) {
    return this.AuthService.currentUser()
      .then(user => this.$http.get(`/api/users/${user._id}/translations/${translationId}`))
      .then(res => res.data.translation);
  }

  /**
   * @param {String} Id of the translation to delete.
   * @return {Promise} Resolved when the translation is deleted.
   */
  delete(translationId) {
    return this.AuthService.currentUser()
      .then(user => this.$http.delete(`/api/users/${user._id}/translations/${translationId}`));
  }

  /**
   * @param {String} Id of the translation to be updated.
   * @param {Object} Updated translation data.
   * @return {Promise} Resolved when the key is updated.
   */
  update(translationId, translationData) {
    return this.AuthService.currentUser()
      .then(user => this.$http.post(`/api/users/${user._id}/translations/${translationId}`, translationData))
      .catch(res => this.$q.reject(res.data.errors));
  }

  /**
   * @param {String} Id of the translation.
   * @param {String} Id of of the key to be updated.
   * @param {String} The new value of the key.
   * @return {Promise} Resolved when the key is updated.
   */
  updateKey(translationId, keyId, value) {
    return this.AuthService.currentUser()
      .then(user => this.$http.post(`/api/users/${user._id}/translations/${translationId}/keys/${keyId}`, { value }));
  }
}
