angular.module('desktop', ['bom.observations', 'bom.plot'])
    .controller('DesktopController', ($scope, BomStations, Preferences) ->
        $scope.stations = BomStations
        $scope.save = () ->
          Preferences.save()

        Preferences.load()
    )