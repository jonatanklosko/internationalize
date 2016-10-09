export default class UserService {
  constructor($http, $q, AuthService) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;
    this.AuthService = AuthService;
  }

  /**
   * @param {Object} A new user data.
   * @return {Promise} Resolved with the user or rejected with validation errors.
   */
  create(userData) {
    return this.$http.post('/api/users', userData)
      .then(res => this.AuthService.setCurrentUser(res.data.user))
      .catch(res => this.$q.reject(res.data.errors));
  }
}
