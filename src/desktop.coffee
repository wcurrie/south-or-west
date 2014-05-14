angular.module('desktop', ['bom.plot'])
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
    .factory('Preferences', () ->
      return {
        load: () ->
          if localStorage
            savedStations = localStorage.getItem("stations")
            for s in JSON.parse(savedStations || '["Nowra", "Mt Boyce"]')
              BomStations.filter((d) -> d.name == s)[0].load = true
        save: () ->
          if localStorage
            localStorage.setItem("stations", JSON.stringify(BomStations.filter((d) -> d.load).map((d) -> d.name)))
      }
    )
    .controller('DesktopController', ($scope, Observations, Preferences) ->
        loadThenPlot = () -> Observations.load().then((d) -> $scope.plot(d))

        $scope.stations = BomStations
        $scope.reload = () ->
          Preferences.save()
          loadThenPlot()

        Preferences.load()
        loadThenPlot()
    )