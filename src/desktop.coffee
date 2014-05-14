angular.module('desktop', [])
    .factory('Observations', ($http, $q) ->
        loadStation = (url) -> $http({method: 'GET', url: url})
        return {
          load: () ->
            urls = BomStations.filter((s) -> s.load).map((s) -> "/fwo/" + s.url + ".json")
            $q.all(urls.map(loadStation))
              .then((responses) -> responses.map((r) -> r.data))
              .catch((data, status) -> console.log(data, status))
        }
    )
    .controller('DesktopController', ($scope, Observations) ->
        loadThenPlot = () -> Observations.load().then(plot)

        $scope.stations = BomStations
        $scope.reload = () ->
          savePreferredStations()
          loadThenPlot()

        loadPreferredStations()

        loadThenPlot()
    )