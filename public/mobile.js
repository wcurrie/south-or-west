angular.module('mobile', ['ionic', 'bom.plot', 'bom.observations']).config(function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  });
  $stateProvider.state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  });
  $stateProvider.state('tab.stations', {
    url: '/stations',
    views: {
      'tab-stations': {
        templateUrl: 'templates/tab-stations.html',
        controller: 'StationsCtrl'
      }
    }
  });
  return $urlRouterProvider.otherwise('/tab/dash');
}).controller('DashCtrl', function($scope, Preferences) {
  return $scope.stations = Preferences.load();
}).controller('StationsCtrl', function($scope, Preferences) {
  return $scope.stations = Preferences.load();
});
