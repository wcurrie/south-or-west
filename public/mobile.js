angular.module('mobile', ['ionic', 'bom.plot', 'bom.observations']).config(function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('dash', {
    url: '/dash',
    templateUrl: 'templates/tab-dash.html',
    controller: 'DashCtrl'
  });
  $stateProvider.state('stations', {
    url: '/stations',
    templateUrl: 'templates/tab-stations.html',
    controller: 'StationsCtrl'
  });
  return $urlRouterProvider.otherwise('/dash');
}).controller('DashCtrl', function($scope, Preferences) {
  return $scope.stations = Preferences.load();
}).controller('StationsCtrl', function($scope, Preferences) {
  return $scope.stations = Preferences.load();
});
