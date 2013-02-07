// Copyright 2012 FoundOPS LLC. All Rights Reserved.

var MAP = (function () {
    var my = {};

    //centers map on all users, or current user location if no other users
    my.CenterOnUsers = _.debounce(function () {
        var map = getMap(), location;
        if (!map) return;

        var bounds = getIconBounds();
        //check if there are users
        if (bounds.length > 0) {
            var latLngBounds = new L.LatLngBounds(bounds);
            var zoom = map.getBoundsZoom(latLngBounds) - 1;
            map.setView(latLngBounds.getCenter(), zoom);
        } else {
            //center on current user
            var user = Meteor.user();
            if (user.profile && user.profile.position) {
                location = user.profile.position;
                map.setView([location.lat, location.lng], 12);
            }
        }

        invalidateMapSize();
    }, 500);

    function getMap () {
        return $("#map").data("map");
    }

    var invalidateMapSize = _.debounce(function () {
        var map = getMap();
        if (map)
            map.invalidateSize(false);
    }, 250);

    //region Icons (Markers)

    //add a person icon to the map
    function addIcon (user) {
        var currentUser = Meteor.user();

        //Do not add an icon for the current user
        if (!currentUser || user._id === currentUser._id)
            return;

        if (!user.profile || !user.profile.position) return;

        var map = getMap();
        var location = user.profile.position;
        if (!(location && location.lat && location.lng))
            return;

        var div = USERS.UserPictureElement(user, "false");
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

        //initialize (open/close) popup to prevent delay in setting content
        popupInitializing = true;
        marker.openPopup();
        marker.closePopup();
        popupInitializing = false;

        //TODO opacity if inactive (10 minutes)
    }

    //return the associated icon for a person
    my.FindIcon = function (userId) {
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

    function moveIcon (user) {
        var newLocation = user.profile.position;
        if (!(newLocation && newLocation.lat && newLocation.lng))
            return false;

        var icon = my.FindIcon(user._id);
        if (icon) {
            icon.setLatLng(newLocation);
            return true;
        }

        return false;
    }

    function updateIconPicture (user) {
        var icon = my.FindIcon(user._id);
        if (icon) {
            $(icon._icon).html(USERS.UserPictureElement(user, "false"));
        }
    }

    var setIconFlashing = _.debounce(function (userId) {
        var icon = my.FindIcon(userId);
        if (!icon) return;

        if (icon.flashingId) return;

        //animate the icon from green to white to green...etc
        icon.flashingId = Meteor.setInterval(function () {
            var currentColor = $(icon._icon).css('background-color');
            currentColor = currentColor === TOOLS.HexToRGB(UI.Green) ? UI.Yellow : UI.Green;
            $(icon._icon).css('background-color', currentColor);
        }, 500);
    }, 250);

    function setIconStable (userId) {
        var icon = my.FindIcon(userId);
        if (!icon) return;

        Meteor.clearTimeout(icon.flashingId);
        icon.flashingId = null;

        //set back to green
        icon._icon.style.background = UI.Green;
    }

    //returns the bounds of all of the icons on the map
    function getIconBounds () {
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
    }

    //endregion

    //region Popups

    //used when manually forcing a popup to open / close to prevent rendering issues
    var popupInitializing = false;

    function popupOpened (recipient, popup) {
        if (popupInitializing) return;

        //mark the icon as stable since the messages are now read
        setIconStable(recipient);

        CHAT.StartChat(recipient, popup);
    }

    function popupClosed () {
        if (popupInitializing) return;
        CHAT.CloseChat();
    }

    //endregion

    //when users are added: add the icon, center on the users (if its the first load)
    //when users change [position: move the icon], [picture: update the icon]
    var observeUsersHandle;
    function watchUserChanged () {
        if (observeUsersHandle)
            return;

        observeUsersHandle = Meteor.users.find().observe({
            added: function (user) {
                addIcon(user);
                //center on the users
                //it is on a de-bounce so it will only be called once
                my.CenterOnUsers();
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
    function watchMessagesRead () {
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
            var recipient = e.popup._source.userId;
            popupOpened(recipient, e.popup);
        });
        map.on('popupclose', popupClosed);

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

    Meteor.startup(function () {
        //fix map rendering issue on resize
        $(window).resize(invalidateMapSize);
    });

    return my;
}());
