export default class TranslationService {
  constructor($http, $q) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
  }

  /**
   * @param {Object} A new translation data.
   * @return {Promise} Resolved with the translation or rejected with validation errors.
   */
  create(translationData) {
    return this.$http.post('/api/translations', translationData)
      .then(res => res.data.translation)
      .catch(res => this.$q.reject(res.data.errors));
  }
}
