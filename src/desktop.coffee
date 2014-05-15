angular.module('desktop', ['bom.observations', 'bom.plot'])
    .controller('DesktopController', ($scope, Preferences) ->
        $scope.stations = Preferences.load()
    )