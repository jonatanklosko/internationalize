export default class TranslationService {
  constructor($http, $q, AuthService) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
    this.AuthService = AuthService;
  }

  /**
   * @param {Object} A new translation data.
   * @return {Promise} Resolved with the translation or rejected with validation errors.
   */
  create(translationData) {
    return this.AuthService.currentUser()
      .then(user => this.$http.post(`/api/users/${user._id}/translations`, translationData))
      .then(res => res.data.translation)
      .catch(res => this.$q.reject(res.data.errors));
  }

  /**
   * Should include current user id in the url (?)
   */
  getAll() {
    return this.AuthService.currentUser()
      .then(user => this.$http.get(`/api/users/${user._id}/translations`))
      .then(res => res.data.translations)
      .catch(res => this.$q.reject(res.data.error));
  }
}
