//subscribe to the messages / users
Meteor.subscribe("directory");
Meteor.subscribe("messages");

///////////////////////////////////////////////////////////////////////////////
// Users
Accounts.ui.config({
    requestPermissions: {
        gmail: ["profile", "email"]
    },
    requestOfflineToken: {
        google: true
    }
});

Meteor.autorun(function () {
    var user = Meteor.user();
    if (user)
        Session.set("currentUser", user._id);
    else
        Session.set("currentUser", null);
});

var displayName = function (user) {
    if (!user)
        return "";

    if (user.profile && user.profile.name)
        return user.profile.name;

    if (user.emails && user.emails[0])
        return user.emails[0].address;

    if (user.services && user.services.google && user.services.google.email)
        return user.services.google.email;

    return "test";
};

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
    //TODO add back min accuracy: || position.coords.accuracy > MIN_ACCURACY

    if (!position || !position.coords) return;
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

if (navigator.geolocation) {
    Meteor.setInterval(function () {
        navigator.geolocation.getCurrentPosition(updateUserPosition);
    }, POS_UPDATE_HEARTBEAT);
}

///////////////////////////////////////////////////////////////////////////////
// Chat

//options should include: recipient, text
var createMessage = function (text) {
    var options = {created: new Date(), recipient: Session.get("recipient"), text: text};
    Meteor.call('createMessage', options, function (error, message) {
        if (!error) {
            //TODO update sent status of message
        }
    });
};

//recipient -> the user currently talking with
Template.chat.recipientName = function () {
    var recipient = Meteor.users.find({_id: Session.get("recipient")}).fetch();
    if (recipient[0])
        return displayName(recipient[0]);
    return "";
};

Template.chat.recipientImage = function () {
    //TODO setup
    return "emptyPerson3.png";
};

Template.chat.senderImage = function () {
    //TODO setup
    return "testImage.png";
};

//Returns if the userId is the current user
Template.chat.iAm = function (userId) {
    return Session.get("currentUser") === userId;
};

//{$or: [
//    {
//        author: ,
//        recipient:
//    },
//    {
//        ,
//        recipient: Session.get("currentUser")
//    }
//]}

//Template.chat.messages = function () {
//    return Messages.find({
//            $or: [
//                {author: Session.get("recipient")},
//                {recipient: Session.get("recipient")}
//            ]},
//        {sort: {created: 1}});
//};

Template.chat.messageGroups = function () {
    var messages = Messages.find({
            $or: [
                {author: Session.get("recipient")},
                {recipient: Session.get("recipient")}
            ]},
        {sort: {created: 1}}).fetch();

    //Each message group has:
    //messages: an array of messages
    //author: the author of the messages
    //last: the last message's date
    var messageGroups = [];

    var groupIndex = -1;
    for (var i in messages) {
        var message = messages[i];
        var messageGroup = messageGroups[groupIndex];

        //

        //use the same message group if the author is the same
        //and the last message is within 5 minutes
        if (messageGroup && messageGroup.author === message.author &&
            (new Date(message.created) - new Date(messageGroup.last) < 5 * 60000)) {
            messageGroup.messages.push(message);
            messageGroup.last = message.created;
        } else {
            messageGroups.push({author: message.author, messages: [message], last: message.created});
            groupIndex++;
        }
    }

    return messageGroups;
};

var sendMessage = function (textArea) {
    var text = textArea.value;
    createMessage(text);
    textArea.value = "";
    textArea.focus();
};

//track enter on text area & scroll to bottom
var setupPopup = function (popup) {
    var textArea = $(popup._container).find("textarea");

    textArea.keyup(function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            sendMessage(textArea[0]);
        }
    });

    $(popup._container).find(".senderImage").click(function () {
        sendMessage(textArea[0]);
    });

    var objDiv = $(popup._container).find(".messages")[0];
    if (objDiv)
        objDiv.scrollTop = objDiv.scrollHeight;

    textArea.focus();
};

Template.chat.rendered = function () {
    var icon = findIcon(Session.get("recipient"));
    if (!icon) {
        return;
    }

    var clonedChat = $($("#currentChat").clone().outerHTML()).attr("id", "").outerHTML();
    icon._popup.setContent(clonedChat);

    setupPopup(icon._popup);

    //setup popup
    console.log("rendered chat");
};

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
    }, 200);
};

var getMap = function () {
    return $("#map").data("map");
};

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

    var icon = L.icon({
        iconUrl: "emptyPerson3.png",
        iconAnchor: [11, 23],
        popupAnchor: [67, -40],
        shadowUrl: "marker9.png",
        shadowAnchor: [14, 26]
    });

    var marker = L.marker([location.lat, location.lng], {
        icon: icon
    });
    //setup an empty popup
    marker.bindPopup("");

    //store the associated it
    marker.userId = user._id;
    map.addLayer(marker);

    colorMarkers("#7fbb00");
    map.setView([location.lat, location.lng], 12);
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

var watchingUserChanged = false;
var watchUserChanged = function () {
    if (watchingUserChanged)
        return;

    Meteor.users.find().observe({
        added: function (user) {
            console.log("User Added");
            addIcon(user);
        },
        changed: function (newUser, atIndex, oldUser) {
            console.log("User Changed");
            if (!moveIcon(newUser))
                addIcon(newUser);
        },
        removed: function () {
            //TODO remove from map
            console.log("Lost one");
        }
    });

    watchingUserChanged = true;
};

Template.map.rendered = function () {
    var map = L.map('map', {
        doubleClickZoom: false
    }).setView([49.25044, -123.137], 13);

    L.tileLayer("http://{s}.tile.cloudmade.com/" + "0187c3ce6f41462a9919ccf1f161aec9" + "/997/256/{z}/{x}/{y}.png", {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
    }).addTo(map);

    //scrolls to the newest messages (at the bottom) on popup open
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

///////////////////////////////////////////////////////////////////////////////
// General
var isMobile = function () {
    return false;
};

Session.set("mobile", isMobile());