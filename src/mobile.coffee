angular.module('mobile', ['ionic', 'bom.plot', 'bom.observations'])
.config(($stateProvider, $urlRouterProvider) ->
  $stateProvider
    .state('dash', {
      url: '/dash',
      templateUrl: 'templates/tab-dash.html',
      controller: 'DashCtrl'
    })
  $stateProvider
    .state('stations', {
      url: '/stations',
      templateUrl: 'templates/tab-stations.html',
      controller: 'StationsCtrl'
    })
  $urlRouterProvider.otherwise('/dash')
)
.controller('DashCtrl', ($scope, Preferences) ->
  $scope.stations = Preferences.load()
)
.controller('StationsCtrl', ($scope, Preferences) ->
  $scope.stations = Preferences.load()
)

