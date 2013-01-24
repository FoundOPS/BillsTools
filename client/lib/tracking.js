///////////////////////////////////////////////////////////////////////////////
// Tracking

var POS_UPDATE_HEARTBEAT = 5000; //milliseconds
var MIN_ACCURACY = 75; //meters

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
    if (!position || !position.coords) return;

    //require a min accuracy on mobile devices
    if (IsMobileDevice() && position.coords.accuracy > MIN_ACCURACY) return;

    var user = Meteor.user();
    if (!user) return;

    //change the position object to the one we use
    position = {time: position.timestamp, accuracy: position.coords.accuracy, lat: position.coords.latitude, lng: position.coords.longitude};

    var last = user.profile ? user.profile.position : null;
    var now = position;

    //only update if the location changed > than the accuracy
    if (last && last.lat) {
        if (now.accuracy >
            distanceCalculator(last.lat, last.lng, now.lat, now.lng, EARTH_DIAMETER)) return;
    }

    if (!user.profile) {
        var profile = {position: now};
        Meteor.users.update(user, {"$set": {"profile": profile }});
    } else {
        Meteor.users.update(user, {"$set": {"profile.position": now }});
    }
};

function startTracking() {
    if (navigator.geolocation) {
        Meteor.setInterval(function () {
            navigator.geolocation.getCurrentPosition(updateUserPosition);
        }, POS_UPDATE_HEARTBEAT);
    }
}