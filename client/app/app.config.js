export default ($locationProvider, $urlRouterProvider) => {
  'ngInject';

  /* Prittify urls by not using the hash-prefixed paths.
     This requires the server to respond to '/*' with the index.html. */
  $locationProvider.html5Mode(true);

  /* Set the default route. */
  $urlRouterProvider.otherwise('/');
};
