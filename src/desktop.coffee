angular.module('desktop', ['bom.plot'])
    .controller('DesktopController', ($scope, Observations, Preferences) ->
        loadThenPlot = () -> Observations.load().then((d) -> $scope.plot(d))

        $scope.stations = BomStations
        $scope.reload = () ->
          Preferences.save()
          loadThenPlot()

        Preferences.load()
        loadThenPlot()
    )