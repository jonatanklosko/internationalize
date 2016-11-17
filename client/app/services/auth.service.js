export default class AuthService {
  constructor($http, $q) {
    'ngInject';

    this.$http = $http;
    this.$q = $q;

    this.userWatchers = [];
  }

  /**
   * @param {Object} credentials A user credentials (username and password).
   * @return {Promise} Resolved with the user or rejected with an error.
   */
  signIn(credentials) {
    return this.$http.post('/auth/signin', credentials)
      .then(res => this.setCurrentUser(res.data.user))
      .catch(res => this.$q.reject(res.data.error));
  }

  /**
   * @return {Promise} Resolved when the current user is signed out.
   */
  signOut() {
    return this.$http.delete('/auth/signout')
      .then(() => this.setCurrentUser(null));
  }

  /**
   * @param {Object} user A user data.
   * @return {Object} The user data.
   */
  setCurrentUser(user) {
    if(this.user !== user) {
      this.user = user;
      this._notifyUserWatchers();
    }
    return this.user;
  }

  /**
   * @return {Promise} Resolved with the current user.
   */
  currentUser() {
    if(this.user === undefined) {
      /* Don't use the `setCurrentUser` method here to avoid notifying
         user watchers as the `watchUser` method does it. */
      return this.$http.get('/auth/me')
        .then(res => this.user = res.data.user)
        .catch(() => this.user = null);
    } else {
      return this.$q.resolve(this.user);
    }
  }

  /**
   * Adds listeners for the user data change.
   *
   * @param {Function} fn A function called with the current user immediately and whenever it changes.
   * @return {Promise} Resolved when the given function is called for the first time.
   */
  watchUser(fn) {
    this.userWatchers.push(fn);
    return this.currentUser().then(fn);
  }

  _notifyUserWatchers() {
    this.userWatchers.forEach(fn => fn(this.user));
  }
}
