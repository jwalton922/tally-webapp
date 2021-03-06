'use strict';

angular.module('tallyApp')
        .controller('MainCtrl', function($scope, $log, $http, $timeout) {
    $scope.tallyName = "";
    $scope.tallyFields = "";
    $scope.tallyQuery = "";
    $scope.selectedTally;
    $scope.selectedTallyField;
    $scope.timeBin = 1000 * 60 * 1;
    $scope.d3Chart = null;
    $scope.d3Starttime = null;
    $scope.d3EndTime = null;
    $scope.d3Data = [];
    $scope.dataMap = {};

    $scope.createTally = function() {
        $log.log("create tally called");
        var url = "http://localhost:8182/graphs/mongograph/vertices";
        var tally = {};
        tally["OBJECT_TYPE"] = "TALLY_DEFINITION";
        tally.tallyName = $scope.tallyName;
        var tallyFieldList = $scope.tallyFields.split(",");
        tally.tallyFields = tallyFieldList;
        tally.tallyQuery = $scope.tallyQuery;
        $http.post(url, tally).success(function(xhr) {
            $log.log("Success: " + angular.toJson(xhr));
        }).error(function(xhr) {
            $log.log("error: " + angular.toJson(xhr));
        });
    };

    $scope.tallies = [];

    $scope.init = function() {
        $log.log("main.js init called");
        $scope.getTallyDefinitions();

    }

    $scope.initD3Chart = function() {


        var currentTime = new Date().getTime();
        var startTime = currentTime - (1000 * 60 * 30);
        startTime = startTime - (startTime % ($scope.timeBin));
        var pushCount = 0;
        $scope.getTallyCountsDRPC(startTime, function(counts) {
            var tallyData = [];

            for (var i = 0; i < counts.length; i++) {
                var time = counts[i]["TIME_BIN"];

                var timeCounts = counts[i].counts;
                var total = 0;
                for (var j = 0; j < timeCounts.length; j++) {
                    total += timeCounts[j].count;
                }
                //$log.log("time: "+time+" total: "+total);
                pushCount++;
                tallyData.push([time, total]);
            }
//            $log.log("Sorting: " + data.length + " data points");
            tallyData.sort(function(a, b) {
                var timeA = a[0];
                var timeB = b[0];
                return timeA - timeB;
            });
            $scope.d3Data = [];
            $scope.d3Data.push([]);
            for (i = 0; i < tallyData.length; i++) {
                $scope.d3Data[0].push(tallyData[i][1]);
            }
            $scope.d3Starttime = tallyData[0][0];
            $scope.d3EndTime = tallyData[tallyData.length - 1][0];
            $scope.dataMap = {displayNames: ["tallySeries 1"], colors: ["green"], scale: "linear", "start": $scope.d3Starttime, "end": $scope.d3EndTime, "step": $scope.timeBin, "names": ["TALLY COUNTS"], "values": $scope.d3Data};
            //$log.log("D3 values: " + angular.toJson(data, true));
            $scope.d3Chart = new LineGraph({containerId: 'd3graph', data: $scope.dataMap});
            $timeout($scope.updateD3Chart, 5000);
        });
    }

    $scope.updateD3Chart = function() {
        $log.log("updateD3Chart called");
        var currentTime = new Date().getTime();
        var startTime = currentTime - (1000 * 60 * 1);
        startTime = startTime - (startTime % ($scope.timeBin));
        $log.log("query data newer than: " + startTime);
        $scope.getTallyCountsDRPC(startTime, function(counts) {
            //$log.log("updated counts: " + angular.toJson(counts, true));
            var tallyData = [];

            for (var i = 0; i < counts.length; i++) {
                var time = counts[i]["TIME_BIN"];

                var timeCounts = counts[i].counts;
                var total = 0;
                for (var j = 0; j < timeCounts.length; j++) {
                    total += timeCounts[j].count;
                }
                //$log.log("time: "+time+" total: "+total);
//                pushCount++;
                tallyData.push([time, total]);
            }
//            $log.log("Sorting: " + data.length + " data points");
            tallyData.sort(function(a, b) {
                var timeA = a[0];
                var timeB = b[0];
                return timeA - timeB;
            });
            if (tallyData.length === 0) {

            } else {
                var endTime = tallyData[tallyData.length - 1][0];
                var numNewBins = (endTime - $scope.d3EndTime) / $scope.timeBin;

                $scope.dataMap.end = endTime;

//            $scope.d3Chart.slideData($scope.dataMap);
                $log.log("endTime: " + endTime + " numNewBins: " + numNewBins + " new value: " + tallyData[0][1]);
                if (numNewBins === 0) {
                    $log.log("changing count from: " + $scope.d3Data[0][$scope.d3Data[0].length - 1] + " to " + tallyData[0][1]);
                    $scope.d3Data[0][$scope.d3Data[0].length - 1] = tallyData[0][1];
                    $scope.dataMap.values = $scope.d3Data;
//                 $scope.dataMap.values = $scope.d3Data;
                    $scope.d3Chart.updateData($scope.dataMap);
                } else {
                    for (var z = 0; z < tallyData.length; z++) {
                        $scope.d3Data[0].shift();
                        $scope.d3Data[0].push(tallyData[z][1]);
                    }
                }
            }
            $timeout($scope.updateD3Chart, 1000);

        });
    }

    $scope.initStockChart = function() {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });

//        1377277740000
//        1377278027543
        var currentTime = new Date().getTime();
        var startTime = currentTime - (1000 * 60 * 30);
        startTime = startTime - (startTime % ($scope.timeBin));
        var pushCount = 0;
        $scope.getTallyCountsDRPC(startTime, function(counts) {
            var data = [];
            for (var i = 0; i < counts.length; i++) {
                var time = counts[i]["TIME_BIN"];

                var timeCounts = counts[i].counts;
                var total = 0;
                for (var j = 0; j < timeCounts.length; j++) {
                    total += timeCounts[j].count;
                }
                //$log.log("time: "+time+" total: "+total);
                pushCount++;
                data.push([time, total]);
            }
            $log.log("Sorting: " + data.length + " data points");
            data.sort(function(a, b) {
                var timeA = a[0];
                var timeB = b[0];
                return timeA - timeB;
            });
            for (var z = 0; z < data.length; z++) {
                $log.log("inital data index " + z + ": " + angular.toJson(data[z]));
            }
            $log.log("Done with initial data. Size: " + data.length);
            $scope.stockChart = $('#stockChart').highcharts('StockChart', {
                chart: {
                    events: {
                        load: function() {

                            // set up the updating of the chart each second
                            var series = this.series[0];

//                       $scope.updateStockChart();
                            setInterval(function() {
                                var currentTime = new Date().getTime();
                                var startTime = currentTime - (1000 * 60 * 1);
                                startTime = startTime - (startTime % ($scope.timeBin));
                                $log.log("query data newer than: " + startTime);
                                $scope.getTallyCountsDRPC(startTime, function(counts) {
                                    var total = $scope.calculateTotalCount(counts);
                                    $log.log("time: " + currentTime + " Total = " + total);
//                                var pointTime = new Date().getTime();
                                    series.addPoint([currentTime, total]);
//                                $timeout(updateStockChart());
                                });
                            }, 5000)
//                        setInterval(function() {
//                            var x = (new Date()).getTime(), // current time
//                                    y = Math.round(Math.random() * 100);
//                            series.addPoint([x, y], true, true);
//                        }, 1000);
                        }
                    }
                },
                rangeSelector: {
                    buttons: [{
                            count: 1,
                            type: 'minute',
                            text: '1M'
                        }, {
                            count: 5,
                            type: 'minute',
                            text: '5M'
                        }, {
                            type: 'all',
                            text: 'All'
                        }],
                    inputEnabled: false,
                    selected: 0
                },
                title: {
                    text: 'Streaming Tally Counts'
                },
                exporting: {
                    enabled: false
                },
                series: [{
                        name: 'Random data',
                        data: data
                    }]
            });

        });


    }

    $scope.updateStockChart = function() {
        var currentTime = new Date().getTime();
        var startTime = currentTime - 1000 * 60 * 1;
        $scope.getTallyCounts(startTime, function(counts) {
            var total = $scope.calculateTotalCount(counts);
            $log.log("Total = " + total);
            $scope.stockChart.series[0].addPoint(currentTime, total);
            $timeout(updateStockChart());
        });
    }

    $scope.getTallyDefinitions = function() {
        var params = {};
        params.key = "OBJECT_TYPE";
        params.value = "TALLY_DEFINITION";
        $http.get("http://localhost:8182/graphs/mongograph/vertices", {params: params}).success(function(xhr) {
            $log.log("Tallies: " + angular.toJson(xhr, true));
            $scope.tallies = xhr.results;
            $scope.selectedTally = $scope.tallies[0];
//             $scope.initStockChart();
            $scope.initD3Chart();
        }).error(function(xhr) {
            $log.log("Error getting tally definitions: " + angular.toJson(xhr));
        });
    }

    $scope.getTallyCountsDRPC = function(startTime, callback) {
        var gremlinScript = "g.V().has('TALLY_NAME','" + $scope.selectedTally.tallyName + "').has('TIME_BIN', T.gte," + startTime + ")";
        $log.log("gremlin script: " + gremlinScript);

        var params = {};
        params.tallyName = $scope.selectedTally.tallyName;
        params.startTime = startTime;
        $http.get("http://localhost:3000/tallyQuery", {params: params}).success(function(xhr) {
//            $log.log("Tally counts: "+angular.toJson(xhr,true));
            callback(xhr);

        }).error(function(xhr) {
            $log.log("error getting tally counts: " + angular.toJson(xhr));
        });
    }

    $scope.getTallyCounts = function(startTime, callback) {
//        var currentTime = new Date().getTime();
//        var oldestTime = currentTime - 1000 * 60 * 10;
        var gremlinScript = "g.V().has('TALLY_NAME','" + $scope.selectedTally.tallyName + "').has('TIME_BIN', T.gte," + startTime + ")";
        $log.log("gremlin script: " + gremlinScript);

        var params = {};
        params.script = gremlinScript;

        $http.get("http://localhost:8182/graphs/mongograph/tp/gremlin", {params: params}).success(function(xhr) {
//            $log.log("Tally counts: "+angular.toJson(xhr,true));
            callback(xhr.results);

        }).error(function(xhr) {
            $log.log("error getting tally counts: " + angular.toJson(xhr));
        });

    }

    $scope.calculateTotalCount = function(results) {
        $log.log("There are " + results.length + " tally count objects");
        var totalCount = 0;
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var counts = result.counts;
            for (var j = 0; j < counts.length; j++) {
                var count = counts[j];
                // $log.log("Count: " + angular.toJson(count, true));
                totalCount += count.count;

            }
        }

        return totalCount;
    }
});
