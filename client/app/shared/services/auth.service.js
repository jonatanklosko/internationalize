(() => {
  angular.module('app.services')
    .factory('authService', authServiceFactory);

  function authServiceFactory($http, $q) {
    'ngInject';

    let user = undefined;
    let userWatchers = [];

    const notifyUserWatchers = () => userWatchers.forEach(fn => fn(user));

    return {
      /**
       * @param {Object} User credentials (username and password).
       * @return {Promise} Resolved with the user or rejected with an error.
       */
      signIn: function(credentials) {
        return $http.post('/auth/signin', credentials)
          .then(res => this.setCurrentUser(res.data.user))
          .catch(res => $q.reject(res.data.error));
      },

      /**
       * @return {Promise} Resolved when the current user is signed out.
       */
      signOut: function() {
        return $http.delete('/auth/signout')
          .then(() => this.setCurrentUser(null));
      },

      /**
       * @param {Object} A user data.
       * @return {Object} The user data.
       */
      setCurrentUser: function(userData) {
        if(user !== userData) {
          user = userData;
          notifyUserWatchers();
        }
        return user;
      },

      /**
       * @return {Promise} Resolved with the current user.
       */
      currentUser: function() {
        if(user === undefined) {
          /* Don't use the `setCurrentUser` method here to avoid notifying
             user watchers as the `watchUser` method does it. */
          return $http.get('/auth/me')
            .then(res => user = res.data.user)
            .catch(() => user = null);
        } else {
          return $q.resolve(user);
        }
      },

      /**
       * Adds listeners for the user data change.
       *
       * @param {Function} A function called with the current user immediately and whenever it changes.
       * @return {Promise} Resolved when the given function is called for the first time.
       */
      watchUser: function(fn) {
        userWatchers.push(fn);
        return this.currentUser().then(fn);
      }
    };
  }
})();
