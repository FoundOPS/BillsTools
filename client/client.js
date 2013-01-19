Meteor.subscribe("directory"); //subscribe to the users

///////////////////////////////////////////////////////////////////////////////
// Tracking
var POS_UPDATE_HEARTBEAT = 5000; //milliseconds
var MIN_UPDATE_DISTANCE = 50; //meters
var MIN_ACCURACY = 25; //meters

var EARTH_DIAMETER = 12756274; // meters
/**
 * Havesine formula https://gist.github.com/1163223
 * @param a lat 1
 * @param b lon 1
 * @param c lat 2
 * @param d lon 1
 * @param e earth diameter (might be any unit)
 * @param [z] placeholder
 * @return {Number} distance
 */
var distanceCalculator = function (a, b, c, d, e, z) {
    with (Math)return z = PI / 360, e * atan2(sqrt(z = pow(sin((c - a) * z), 2) + cos(a * z * 2) * cos(c * z * 2) * pow(sin((d - b) * z), 2)), sqrt(1 - z))
};
var updateUserPosition = function (position) {
    if (!position || !position.coords || position.coords.accuracy > MIN_ACCURACY) return;
    var user = Meteor.user();
    if (!user) return;

    //change the position object to the one we use
    position = {time: position.timestamp, accuracy: position.coords.accuracy, lat: position.coords.latitude, lng: position.coords.longitude};

    var last = user.profile.position;
    var now = position;

    //if the last position was < 25 meters, do not update
    if (last && last.lat) {
        if (MIN_UPDATE_DISTANCE >
            distanceCalculator(last.lat, last.lng, now.lat, now.lng, EARTH_DIAMETER)) return;
    }

    Meteor.users.update(user, {$set: { profile: {position: now }}});
};

if (navigator.geolocation) {
    Meteor.setInterval(function () {
        navigator.geolocation.getCurrentPosition(updateUserPosition);
    }, POS_UPDATE_HEARTBEAT);
}

///////////////////////////////////////////////////////////////////////////////
// Map
var hexToRGB = function (Hex) {
    var Long = parseInt(Hex.replace(/^#/, ""), 16);
    return {
        R: (Long >>> 16) & 0xff,
        G: (Long >>> 8) & 0xff,
        B: Long & 0xff
    };
};
var colorMarkers = function (color) {
    //wait for the markers to be loaded
    _.delay(function () {
        //http://stackoverflow.com/questions/9303757/how-to-change-color-of-an-image-using-jquery
        var i = 0;
        $(".leaflet-shadow-pane").find("img").each(function () {
            //prevent a canvas error because the widget isn't ready yet, try again
            if (this.height === 0 || this.width === 0 || this.naturalWidth === 0 || this.naturalHeight === 0) {
                return false; //break the loop
            }

            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = this.width;
            canvas.height = this.height;

            ctx.drawImage(this, 0, 0, this.naturalWidth, this.naturalHeight, 0, 0, this.width, this.height);
            var originalPixels = ctx.getImageData(0, 0, this.width, this.height);
            var currentPixels = ctx.getImageData(0, 0, this.width, this.height);

            if (!originalPixels) return; // Check if image has loaded

            var newColor = "";
            if (color) {
                newColor = hexToRGB(color);
            }

            for (var I = 0, L = originalPixels.data.length; I < L; I += 4) {
                if (currentPixels.data[I + 3] > 0) {
                    currentPixels.data[I] = originalPixels.data[I] / 255 * newColor.R;
                    currentPixels.data[I + 1] = originalPixels.data[I + 1] / 255 * newColor.G;
                    currentPixels.data[I + 2] = originalPixels.data[I + 2] / 255 * newColor.B;
                }
            }

            ctx.putImageData(currentPixels, 0, 0);
            this.src = canvas.toDataURL("image/png");
            i++;
        });
    }, 100);
};

var getMap = function () {
    return $("#map").data("map");
};

//add a person icon to the map
var addIcon = function (user) {
    var map = getMap();
    var location = user.profile.position;
    if (!(location && location.lat && location.lng))
        return;

    var icon = L.icon({
        iconUrl: "emptyPerson3.png",
        iconAnchor: [11, 47],
        popupAnchor: [0, -50],
        shadowUrl: "marker7.png",
        shadowAnchor: [14, 50]
    });

    var marker = L.marker([location.lat, location.lng], {
        icon: icon
    });
    //store the associated it
    marker.userId = user._id;

//    marker.bindPopup("<div class='chatBox'><div class='chatTop'>" +
    //TODO template inside here? http://docs.meteor.com/#meteor_render
//        "<img src='emptyPerson3.png' /> Bob</div>" +
//        "<div class='chatArea'>" +
//        "<ul class='messages'>" +
//        "<li class='message'><span class='messageContent'>Hey, This is Bob. I'm hungry!</span><br /><span class='time'>6:16 pm</span></li>" +
//        "<li class='message owner'><span class='messageContent'>There's nothing I can do for you from here, sorry Bob.</span><br /><span class='time'>6:16 pm</span></li>" +
//        "<li class='message owner'><span class='messageContent'>There's nothing I can do for you from here, sorry Bob.</span><br /><span class='time'>6:16 pm</span></li>" +
//        "<li class='message'><span class='messageContent'>Hey, This is Bob. I'm hungry!</span><br /><span class='time'>6:16 pm</span></li>" +
//        "<li class='message owner'><span class='messageContent'>There's nothing I can do for you from here, sorry Bob.</span><br /><span class='time'>6:16 pm</span></li>" +
//        "</ul>" +
//        "<textarea></textarea>" +
//        "</div>" +
//        "</div>");

    map.addLayer(marker);
    colorMarkers("#7fbb00");

    map.setView([location.lat, location.lng], 12);
};
var moveIcon = function (user, oldLocation) {
    var map = getMap();
    var newLocation = user.profile.position;
    if (!(newLocation.lat && newLocation.lng))
        return;

    var layers = map._layers;
    for (var key in layers) {
        var layer = layers[key];
        if (layer.userId === user._id) {
            layer.setLatLng(newLocation);
        }
    }
};

Template.map.rendered = function () {
    var self = this;

    var map = L.map('map', {
        doubleClickZoom: false
    }).setView([49.25044, -123.137], 13);

    L.tileLayer("http://{s}.tile.cloudmade.com/" + "0187c3ce6f41462a9919ccf1f161aec9" + "/997/256/{z}/{x}/{y}.png", {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
    }).addTo(map);

    //scrolls to the newest messages (at the bottom) on popup open
    map.on('popupopen', function (e) {
        var objDiv = $(".messages")[0];
        objDiv.scrollTop = objDiv.scrollHeight;
    });

    //store the map on the element so it can be retrieved elsewhere
    $("#map").data("map", map);

//    var location = {
//        latitude: 40,
//        longitude: -86
//    };
    //addIcon(map, location);
};

Meteor.users.find().observe({
    added: function (user) {
        console.log("User Added");
        addIcon(user);
    },
    changed: function (newUser, atIndex, oldUser) {
        console.log("User Changed");
        var oldPosition = oldUser.profile.position;
        if (oldPosition)
            moveIcon(newUser, oldPosition);
    },
    removed: function () {
        //TODO remove from map
        console.log("Lost one");
    }
});

///////////////////////////////////////////////////////////////////////////////
// Chat

//options should include: recipient, text
var createMessage = function (options) {
    options.created = new Date();
    Meteor.call('createMessage', options, function (error, message) {
        if (!error) {
            //TODO update sent status of message
        }
    });
};
