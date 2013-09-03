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
function TracksCtrl($scope, $log, $timeout) {
    $scope.messageCount = 0;
    $scope.map = null;
    $scope.tracks = {};
    $scope.airplaneIcon = null;
    $scope.updatedPositionData = [];

    $scope.init = function() {
        $log.log("TracksCtrl init called!");


        $scope.airplaneIcon = L.icon({
            iconUrl: 'images/airplane_icon.png',
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
        
        $scope.updatePositions();
    }

    $scope.updatePositions = function() {
        for (var i = 0; i < $scope.updatedPositionData.length; i++) {
            var trackData = $scope.updatedPositionData[i];
            var trackid = trackData["TRACKID"];
            
            var trackObj = $scope.tracks[trackid];
            if (!trackObj) {
                trackObj = {};
                $scope.tracks[trackid] = trackObj;
            }

            if (trackObj.marker) {
                trackObj.marker.setLatLng(new L.LatLng(trackData["LATITUDE"], trackData["LONGITUDE"]));
                trackObj.marker.options.iconAngle = trackData["HEADING"];
                var popupContent = $scope.createPopupFromEvent(trackData);
                trackObj.marker.setPopupContent(popupContent)
                trackObj.marker.update();
                trackObj.lastSeenTime = trackData["TIME"];
            } else {
                $log.log("track data: "+angular.toJson(trackData));
                trackObj.marker = new L.Marker(new L.LatLng(trackData["LATITUDE"], trackData["LONGITUDE"]), {icon: $scope.airplaneIcon, iconAngle: trackData["HEADING"], title : trackData["TRACKID"]});
                // $log.log("Marker: "+angular.toJson(trackObj.marker));
                var popupContent = $scope.createPopupFromEvent(trackData);
                $log.log("popupContent = "+popupContent);
                trackObj.marker.bindPopup(popupContent, {})
                trackObj.marker.addTo($scope.map);
                trackObj.lastSeenTime = trackData["TIME"];
            }

            // $log.log("Track id = " + trackid);

        }
        $scope.updatedPositionData = [];
        var currentTime = new Date().getTime();
        for(var key in $scope.tracks){
            var track = $scope.tracks[key];
            var timeAgo = currentTime - track.lastSeenTime;
            if(timeAgo > 120000){
                $log.log("removing track object, too much time elapsed: "+timeAgo);
                $scope.map.removeLayer(track.marker);
                delete $scope.tracks[key];
            }
        }
        $timeout($scope.updatePositions, 1000);
    }
    
    $scope.createPopupFromEvent = function(event){
        var htmlString = "<div><ul>";
        for(var key in event){
            htmlString+="<li>"+key+" = "+event[key]+"</li>"
        }
        htmlString+="</ul></div>";
        return htmlString;
    }


}