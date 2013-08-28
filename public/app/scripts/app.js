'use strict';

angular.module('tallyApp', [])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      }) .when('/tracks', {
        templateUrl: 'views/tracks.html',
        controller: 'TracksCtrl'
      })
      .otherwise(
      {        
        redirectTo: '/'
      });
  });
