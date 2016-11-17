export default class UserService {
  constructor($http, $q, AuthService) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
    this.AuthService = AuthService;
  }

  /**
   * @param {Object} userAttributes A new user attributes.
   * @return {Promise} Resolved with the user or rejected with validation errors.
   */
  create(userAttributes) {
    return this.$http.post('/api/users', userAttributes)
      .then(res => this.AuthService.setCurrentUser(res.data.user))
      .catch(res => this.$q.reject(res.data.errors));
  }
}
