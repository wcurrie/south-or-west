angular.module('mobile', ['ionic', 'bom.plot', 'bom.observations'])
.config(($stateProvider, $urlRouterProvider) ->
  $stateProvider
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })
  $stateProvider
    .state('tab.dash', {
      url: '/dash',
      views: {
        'tab-dash': {
          templateUrl: 'templates/tab-dash.html',
          controller: 'DashCtrl'
        }
      }
    })
  $stateProvider
    .state('tab.stations', {
      url: '/stations',
      views: {
        'tab-stations': {
          templateUrl: 'templates/tab-stations.html',
          controller: 'StationsCtrl'
        }
      }
    })
  $urlRouterProvider.otherwise('/tab/dash')
)
.controller('DashCtrl', ($scope, Preferences) ->
  $scope.stations = Preferences.load()
)
.controller('StationsCtrl', ($scope, Preferences) ->
  $scope.stations = Preferences.load()
)

