var getMap = function () {
    return $("#map").data("map");
};

//region Icons (Markers)

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

    var div = userPictureElement(user, "false");
    var icon = L.divIcon({
        iconAnchor: [11, 23],
        popupAnchor: [69.5, -40],
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

var updateIconPicture = function (user) {
    var icon = findIcon(user._id);
    if (icon) {
        $(icon._icon).html(userPictureElement(user, "false"));
    }
};

var setIconFlashing = _.debounce(function (userId) {
    var icon = findIcon(userId);
    if (!icon) return;

    if (icon.flashingId) return;

    //animate the icon from green to white to green...etc
    icon.flashingId = Meteor.setInterval(function () {
        var currentColor = $(icon._icon).css('background-color');
        currentColor = currentColor === HexToRGB(green) ? yellow : green;
        $(icon._icon).css('background-color', currentColor);
    }, 500);
}, 250);
var setIconStable = function (userId) {
    var icon = findIcon(userId);
    if (!icon) return;

    Meteor.clearTimeout(icon.flashingId);
    icon.flashingId = null;

    //set back to green
    icon._icon.style.background = green;
};


var getMarkersBounds = function () {
    var map = getMap();
    var layers = map._layers;
    var bounds = [];
    for (var key in layers) {
        var layer = layers[key];
        if (layer.getLatLng) {
            var location = layer.getLatLng();
            bounds.push(L.latLng([location.lat, location.lng]));
        }
    }
    return bounds;
};

//prevents map centered from being called twice
var mapCentered = false;
//centers map on all users, or current user location if no other users
var centerOnUsers = _.debounce(function (force) {
    if (!force) {
        if (mapCentered) return;
        mapCentered = true;
    }

    var map = getMap(), location;
    var bounds = getMarkersBounds();
    //check if there are users
    if (bounds.length > 0) {
        map.fitBounds([bounds]);
    } else {
        //center on current user
        var user = Meteor.user();
        if (user.profile && user.profile.position) {
            location = user.profile.position;
            map.setView([location.lat, location.lng], 12);
        }
    }
}, 500);

//endregion

//when users are added: add the icon, center on the users (if its the first load)
//when users change [position: move the icon], [picture: update the icon]
var observeUsersHandle;
var watchUserChanged = function () {
    if (observeUsersHandle)
        return;

    observeUsersHandle = Meteor.users.find().observe({
        added: function (user) {
            addIcon(user);
            centerOnUsers();
        },
        changed: function (newUser, atIndex, oldUser) {
            if (oldUser.profile && newUser.profile) {
                //if the position changed move the icon
                if (!_.isEqual(oldUser.profile.position, newUser.profile.position)) {
                    //if the icon doesn't exist yet, add it
                    if (!moveIcon(newUser))
                        addIcon(newUser);
                }
                //if the profile picture changed update the icon picture
                else if (!_.isEqual(oldUser.profile.picture, newUser.profile.picture)) {
                    updateIconPicture(newUser);
                }
            }
        },
        removed: function () {
            //TODO remove from map

        }
    });
};

//when messages are added: if they are unread set their icons to blink
var observeReadHandle;
var watchMessagesRead = function () {
    if (observeReadHandle)
        return;

    var currentUserId = Meteor.userId();

    //find all unread messages for the user
    observeUsersHandle = Messages.find({read: {$ne: true}, recipient: currentUserId}).observe({
        added: function (message) {
            if (Session.get("recipient") !== message.author)
                setIconFlashing(message.author);
        }
    });
};

//TODO constantly check for inactive every minute, add opacity if last trackpoint <10 minutes

Template.map.rendered = function () {
    var map = L.map('map', {
        doubleClickZoom: false,
        maxZoom: 17
    }).setView([40, -89], 4);

    L.tileLayer("http://{s}.tile.cloudmade.com/" + "0187c3ce6f41462a9919ccf1f161aec9" + "/997/256/{z}/{x}/{y}.png", {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
    }).addTo(map);

    map.on('popupopen', function (e) {
        //show popup after a slight delay to let content set (it will override hidden)
        //it was there to prevent the popup from showing up before content is sent
        Meteor.setTimeout(function () {
            $(".leaflet-popup").addClass("show");
        }, 250);

        //recipient
        var recipient = e.popup._source.userId;
        Session.set("recipient", recipient);
        setIconStable(recipient);

        var isMobileSize = IsMobileSize();
        Session.set("isMobileSize", isMobileSize);

        Meteor.Router.to("/chat");

        if (!isMobileSize) {
            setupPopup(e.popup);
        }
    });

    map.on('popupclose', function (e) {
        chatClosed();
    });

    //store the map on the element so it can be retrieved elsewhere
    $("#map").data("map", map);

    watchUserChanged();
    watchMessagesRead();
};

Template.map.destroyed = function () {
    if (observeUsersHandle) {
        observeUsersHandle.stop();
        observeUsersHandle = null;
    }

    if (observeReadHandle) {
        observeReadHandle.stop();
        observeReadHandle = null;
    }

    $("#map").empty();
    $("#map").data("map", null);
};

//fix map rendering issue on resize
//update isMobileSize session variable
var updateSize = _.debounce(function () {
    var map = getMap();
    if (map)
        map.invalidateSize(false);
}, 250);

Meteor.startup(function () {
    $(window).resize(updateSize);
});
