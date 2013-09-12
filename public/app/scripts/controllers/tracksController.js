var _old_update = L.Marker.prototype.update;
L.Marker.include({
    update: function() {
        this._icon.style[L.DomUtil.TRANSFORM] = "";
        _old_update.apply(this, []);

        if (this.options.iconAngle) {
            var a = this.options.icon.options.iconAnchor;
            var s = this.options.icon.options.iconSize;
            a = L.point(s).divideBy(2)._subtract(L.point(a));
            var transform = '';
            transform += ' translate(' + -a.x + 'px, ' + -a.y + 'px)';
            transform += ' rotate(' + this.options.iconAngle + 'deg)';
            transform += ' translate(' + a.x + 'px, ' + a.y + 'px)';
            this._icon.style[L.DomUtil.TRANSFORM] += transform;
        }
    },
    setIconAngle: function(iconAngle) {
        this.options.iconAngle = iconAngle;

        if (this._map)
            this.update();
    }
});



//L.MarkerWithAngle = L.Marker.extend({
//            options: {
//                angle: 0
//            },
//            _setPos: function(pos) {
//                L.Marker.prototype._setPos.call(this, pos);
//                this._icon.style.MozTransform = this._icon.style.WebkitTransform + ' rotate(' + this.options.angle + 'deg)';
//                this._icon.style.MsTransform = this._icon.style.WebkitTransform + ' rotate(' + this.options.angle + 'deg)';
//                this._icon.style.OTransform = this._icon.style.WebkitTransform + ' rotate(' + this.options.angle + 'deg)';
//                this._icon.style.WebkitTransform = this._icon.style.WebkitTransform + ' rotate(' + this.options.angle + 'deg)';
//            }
//        });
function TracksCtrl($scope, $log, $timeout, $http) {
    $scope.messageCount = 0;
    $scope.map = null;
    $scope.tracks = {};
    $scope.airplaneIcon = null;
    $scope.updatedPositionData = [];
    $scope.aircraftCount = 0;
    $scope.updatedPositions = 0;
    $scope.timeSinceLastUpdate = 0;
    $scope.timeOfLastUpdate = null;
    $scope.tweetPairCount = 0;
    $scope.init = function() {
        $log.log("TracksCtrl init called!");


        $scope.airplaneIcon = L.icon({
            iconUrl: 'images/airplane_icon.png',
            iconSize: [30, 30],
            iconAnchor: [60, 60],
        });

        $scope.delayedAirplaneIcon = L.icon({
            iconUrl: 'images/airplane_icon_red.png',
            iconSize: [30, 30],
            iconAnchor: [60, 60],
        });

        $scope.map = L.map('map').setView([51.505, -0.09], 3);
        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo($scope.map);

        var socket = io.connect('http://localhost');
        socket.on('TRACKS', function(data) {
            //$log.log("track update event " + data.length + " objects");
            var currTime = new Date().getTime();
            $scope.updatedPositionData = data;

            $scope.messageCount++;
//            $scope.$apply();
        });

        socket.on('FLIGHT_DELAY_TWEET', function(data) {
            $log.log("tweet: " + angular.toJson(data));
            var lat = data.lat;
            var lon = data.lon;
            if (lat > 0 || lat < 0) {
                $log.log("Craeting marker at " + lat + "," + lon);
                var marker = new L.Marker(new L.LatLng(lat, lon), {title: data.tweet_text});
                marker.addTo($scope.map);
//            var currTime = new Date().getTime();
//            $scope.updatedPositionData = data;
//
//            $scope.messageCount++;
//            $scope.$apply();
            }
        });

        // $scope.updatePositions();

        $scope.getDistantTweetPairs()
    }

    $scope.updatePositions = function() {
        $log.log("There are " + $scope.updatedPositionData.length + " positions");
        $scope.updatedPositions = 0;
        var cTime = new Date().getTime();
        if (!$scope.timeOfLastUpdate) {
            $scope.timeOfLastUpdate = cTime;
        }
        if ($scope.updatedPositionData.length > 0) {
            $scope.timeOfLastUpdate = cTime;
        }
        $scope.timeSinceLastUpdate = (cTime - $scope.timeOfLastUpdate);



        for (var i = 0; i < $scope.updatedPositionData.length; i++) {
            var trackData = $scope.updatedPositionData[i];
            var trackid = trackData["FLIGHT_NUMBER"];
            if (trackData["DELAYED"]) {

            }
            // $log.log("Track id: "+trackid);
            var trackObj = $scope.tracks[trackid];
            if (!trackObj) {
                trackObj = {};
                $scope.tracks[trackid] = trackObj;
            }

            if (trackObj.marker) {
//                if(i < 1){
//                    $log.log(angular.toJson(trackData,true));
//                }
                trackObj.marker.setLatLng(new L.LatLng(trackData["LATITUDE"], trackData["LONGITUDE"]));
                trackObj.marker.options.iconAngle = trackData["HEADING"];
                var date = new Date();
                date.setTime(trackData["TIME"])
                trackData.date = date;
                var popupContent = $scope.createPopupFromEvent(trackData);
                trackObj.marker.setPopupContent(popupContent);
                if (trackData["DELAYED"]) {
                    trackObj.marker.setIcon($scope.delayedAirplaneIcon);
                } else {
                    trackObj.marker.setIcon($scope.airplaneIcon);
                }
                trackObj.marker.update();
                var diff = trackData["TIME"] - trackObj.lastSeenTime;
                if (diff > 0) {
                    $scope.updatedPositions++;
                }
                trackObj.lastSeenTime = trackData["TIME"];

            } else {
                $log.log("track data: " + angular.toJson(trackData));
                trackObj.marker = new L.Marker(new L.LatLng(trackData["LATITUDE"], trackData["LONGITUDE"]), {icon: $scope.airplaneIcon, iconAngle: trackData["HEADING"], title: trackData["FLIGHT_NUMBER"]});
                // $log.log("Marker: "+angular.toJson(trackObj.marker));
                var date = new Date();
                date.setTime(trackData["TIME"]);
                trackData.date = date;
                var popupContent = $scope.createPopupFromEvent(trackData);
                //$log.log("popupContent = "+popupContent);
                trackObj.marker.bindPopup(popupContent, {});
                if (trackData["DELAYED"]) {
                    trackObj.marker.setIcon($scope.delayedAirplaneIcon);
                } else {
                    trackObj.marker.setIcon($scope.airplaneIcon);
                }
                trackObj.marker.addTo($scope.map);
                trackObj.lastSeenTime = trackData["TIME"];
            }

            // $log.log("Track id = " + trackid);

        }
        $scope.updatedPositionData = [];
        var currentTime = new Date().getTime();
        $scope.aircraftCount = 0;
        for (var key in $scope.tracks) {
            var track = $scope.tracks[key];
            var timeAgo = currentTime - track.lastSeenTime;
            if (timeAgo > 900000) {
                $log.log("removing track object, too much time elapsed: " + timeAgo);
                $scope.map.removeLayer(track.marker);
                delete $scope.tracks[key];
            } else {
                $scope.aircraftCount++;
            }
        }
        $timeout($scope.updatePositions, 1000);
    }

    $scope.createPopupFromEvent = function(event) {
        var htmlString = "<div><ul>";
        for (var key in event) {
            htmlString += "<li>" + key + " = " + event[key] + "</li>"
        }
        htmlString += "</ul></div>";
        return htmlString;
    }

    $scope.getDistantTweetPairs = function() {
        var gremlinScript = "g.V().has('OBJECT_TYPE','TWITTER_USER').has('HAS_DISTANT_TWEETS', true)";
        $log.log("gremlin script: " + gremlinScript);

        var params = {};
        params.script = gremlinScript;

        $http.get("http://localhost:8182/graphs/mongograph/tp/gremlin", {params: params}).success(function(xhr) {
            var rainbow = new Rainbow();
            rainbow.setNumberRange(0, xhr.results.length - 1);
//            rainbow.setNumberRange(0, 10);
            for (var i = 0; i < xhr.results.length; i++) {
                var color = rainbow.colourAt(i);
                //$log.log("color: "+angular.toJson(color));
                var distantPairs = xhr.results[i]["DISTANT_TWEETS"];
//                $log.log(distantPairs.length+" distant tweet pairs");
                for (var j = 0; j < distantPairs.length; j++) {
                    $scope.tweetPairCount++;
                    var pair = distantPairs[j];
//                    $log.log("processing distant pair: "+angular.toJson(pair));
                    var firstLatLng = new L.LatLng(pair.firstLat, pair.firstLon)
                    var marker = new L.CircleMarker(firstLatLng, {title: pair.firstTweet, color: "#" + color});
                    marker.bindPopup($scope.createPopupFromEvent({user: xhr.results[i]["USER_ID"], tweet: pair.firstTweet, timeDiff : timeDiff}));
                    marker.addTo($scope.map);
                    var secondLatLng = new L.LatLng(pair.secondLat, pair.secondLon);
                    var marker2 = new L.CircleMarker(secondLatLng, {title: pair.secondTweet, color: "#" + color});
                    marker2.bindPopup($scope.createPopupFromEvent({user: xhr.results[i]["USER_ID"], tweet: pair.secondTweet,timeDiff : timeDiff}));
                    marker2.addTo($scope.map);
                    var timeDiff = pair.secondTime - pair.firstTime;
                    var polyline = new L.Polyline([firstLatLng, secondLatLng], {color: "#"+color});
                    polyline.addTo($scope.map);
                }
//                if (i > 10) {
//                    break;
//                }
            }

        }).error(function(xhr) {
            $log.log("error getting tally counts: " + angular.toJson(xhr));
        });


    }
}