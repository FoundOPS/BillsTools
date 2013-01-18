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
    if (!position || !position.coords || position.coords.accuracy < MIN_ACCURACY) return;
    var user = Meteor.user();
    if (!user) return;

    var last = user.profile.position;
    var now = position;

    //if the last position was < 25 meters, do not update
    if (last && last.coords) {
        if (MIN_UPDATE_DISTANCE >
            distanceCalculator(last.coords.latitude, last.coords.longitude, now.coords.latitude, now.coords.longitude, EARTH_DIAMETER)) return;
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
Template.map.events({
//    'dblclick mousedown text': function (event, template) {
//        //Session.set("selected", event.currentTarget.id);
//    },
    'dblclick .map': function (event, template) {
//        if (!Meteor.userId()) // must be logged in to create events
//            return;
//        var coords = coordsRelativeToElement(event.currentTarget, event);
//        openCreateDialog(coords.x / 500, coords.y / 500);
    }
});

Template.map.rendered = function () {
    var map = L.map('map', {
        doubleClickZoom: false
    }).setView([49.25044, -123.137], 13);

    L.tileLayer("http://{s}.tile.cloudmade.com/" + "0187c3ce6f41462a9919ccf1f161aec9" + "/997/256/{z}/{x}/{y}.png", {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
    }).addTo(map);
};

Template.map.destroyed = function () {
    //TODO destroy map
    this.handle && this.handle.stop();
};

Meteor.users.find().observe({
    added: function (user) {
        //TODO generate on map
        console.log("Added");
        console.log(user);
    },
    changed: function (newDocument, atIndex, oldDocument) {
        console.log("Changed");
        console.log(newDocument);
        //TODO move
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
