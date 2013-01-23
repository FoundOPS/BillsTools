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

//TODO refactor to happen on single marker (when used with statuses)
var colorMarkers = function (color) { //wait for the markers to be loaded
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
};

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

    var icon = L.icon({
        iconUrl: userImage(user),
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

    //store the associated id
    marker.userId = user._id;

    map.addLayer(marker);
    //whenever a marker is added, color it
    _.delay(function () {
        colorMarkers("#7fbb00");
    }, 200); //TODO change to single

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
//endregion

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

Meteor.startup(function () {
    L.NumberedDivIcon = L.Icon.extend({
        options: {
            // EDIT THIS TO POINT TO THE FILE AT http://www.charliecroom.com/marker_hole.png (or your own marker)
            iconUrl: '<%= image_path("leaflet/marker_hole.png") %>',
            number: '',
            shadowUrl: null,
            iconSize: new L.Point(25, 41),
            iconAnchor: new L.Point(13, 41),
            popupAnchor: new L.Point(0, -33),
            /*
             iconAnchor: (Point)
             popupAnchor: (Point)
             */
            className: 'leaflet-div-icon'
        },

        createIcon: function () {
            var div = document.createElement('div');
            var img = this._createImg(this.options['iconUrl']);
            var numdiv = document.createElement('div');
            numdiv.setAttribute("class", "number");
            numdiv.innerHTML = this.options['number'] || '';
            div.appendChild(img);
            div.appendChild(numdiv);
            this._setIconStyles(div, 'icon');
            return div;
        },

        //you could change this to add a shadow like in the normal marker if you really wanted
        createShadow: function () {
            return null;
        }
    });
});