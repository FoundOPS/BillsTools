var getMap = function () {
    return $("#map").data("map");
};

//region Icons

//add a person icon to the map
var addIcon = function (user) {
    var currentUser = Meteor.user();

    //Do not add an icon for the current user
    if (!currentUser || user._id === currentUser._id)
        return;

    if (!user.profile || !user.profile.position) return;

    var map = getMap();
    var location = user.profile.position;
    if (!(location && location.lat && location.lng))
        return;

    //TODO add green color background
    var div = '<img src="' + userImage(user) + '"/>';
    var icon = L.divIcon({
        iconAnchor: [11, 23],
        popupAnchor: [67, -40],
        html: div
    });

    var marker = L.marker([location.lat, location.lng], {
        icon: icon
    });

    //setup an empty popup
    marker.bindPopup("");

    //store the associated id
    marker.userId = user._id;

    map.addLayer(marker);
    //test coloring to white in 2.5 seconds
//    _.delay(function () {
//        updateIconColor(user, "#FFFFFF");
//    }, 2500);

    map.setView([location.lat, location.lng], 12);

    //TODO opacity if inactive (10 minutes)
};

var findIcon = function (userId) {
    var map = getMap();
    if (!map)
        return null;

    var layers = map._layers;
    for (var key in layers) {
        var layer = layers[key];
        if (layer.userId === userId) {
            return layer;
        }
    }

    return null;
};
var moveIcon = function (user) {
    var newLocation = user.profile.position;
    if (!(newLocation && newLocation.lat && newLocation.lng))
        return false;

    var icon = findIcon(user._id);
    if (icon) {
        icon.setLatLng(newLocation);
        return true;
    }

    return false;
};
var updateIconColor = function (user, color) {
    var icon = findIcon(user._id);

    icon._icon.style.background = color;
};

//endregion

//TODO add listener for inactive, add opacity if last trackpoint <10 minutes
var observeUsersHandle;
var watchUserChanged = function () {
    if (observeUsersHandle)
        return;

    observeUsersHandle = Meteor.users.find().observe({
        added: function (user) {
            addIcon(user);
        },
        changed: function (newUser, atIndex, oldUser) {
            //if the position changed move the icon
            if (!(oldUser.profile && newUser.profile &&
                _.isEqual(oldUser.profile.position, newUser.profile.position))) {
                //if the icon doesn't exist yet, add it
                if (!moveIcon(newUser))
                    addIcon(newUser);
            }

            //TODO update user image if it changes
        },
        removed: function () {
            //TODO remove from map

        }
    });
};

Template.map.rendered = function () {
    console.log("render map");
    var map = L.map('map', {
        doubleClickZoom: false
    }).setView([49.25044, -123.137], 13);

    L.tileLayer("http://{s}.tile.cloudmade.com/" + "0187c3ce6f41462a9919ccf1f161aec9" + "/997/256/{z}/{x}/{y}.png", {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
    }).addTo(map);

    map.on('popupopen', function (e) {
        //recipient
        var recipient = e.popup._source.userId;
        Session.set("recipient", recipient);
        setupPopup(e.popup);
    });

    //TODO on close recipient = null

    //store the map on the element so it can be retrieved elsewhere
    $("#map").data("map", map);

    watchUserChanged();
};

Template.map.destroyed = function () {
    if (observeUsersHandle) {
        observeUsersHandle.stop();
        observeUsersHandle = null;
    }

    $("#map").empty();
    $("#map").data("map", null);
};