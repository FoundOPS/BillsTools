///////////////////////////////////////////////////////////////////////////////
// Users
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

    if (user.services && user.services.facebook && user.services.facebook.email)
        return user.services.facebook.email;
};

//generates a users image, a users initials, or a blank image, based on the available data
var userPictureElement = function (user, useBlankImage) {
    var element = "";
    //check if a user and profile exist
    if (user && user.profile) {
        var profile = user.profile;
        //if there's a picture, use it
        if (profile.picture) {
            element = "<img src='" + profile.picture + "'/>";
        //if there's a name, display their initials
        } else if (profile.name && useBlankImage == "false") {
            var splitName = profile.name.split(" ");
            var initials = splitName[0].charAt(0) + splitName[1].charAt(0);
            element = "<div class='initials'>" + initials + "</div>";
        //display the default image
        } else {
            element = "<img src='emptyPerson3.png'/>";
        }
    }

    return element;
};

/**
 * Load the user image from their Facebook or Google
 * @param user The user to load
 * @param callback Returns the name and image as parameters (if it was successful)
 */
var loadUserProfile = function (user, callback) {
    if (!user)
        return;

    var services = user.services;

    if (!services)
        return;

    var fb = services.facebook;
    var goog = services.google;

    var url;
    var data;
    var processor;

    if (fb) {
        url = "https://graph.facebook.com/me";

        data = {
            fields: "picture.width(32).height(32),name",
            access_token: fb.accessToken
        };

        processor = function (profile) {
            var notSet = profile.picture.data.is_silhouette;
            if (notSet)
                profile.picture.data.url = null;

            callback(profile.name, profile.picture.data.url);
        };
    }
    else if (goog) {
        url = "https://www.googleapis.com/oauth2/v1/userinfo";

        data = {
            access_token: goog.accessToken
        };

        processor = function (profile) {
            callback(profile.name, profile.picture);
        };
    }

    $.ajax({
        url: url,
        dataType: 'json',
        data: data,
        success: processor
    });

    //Meteor.http.get(url, options, processor);
};

//Update the current user's profile information from the provider (FB, Google)
//currents updates name and picture (if available)
var updateUserProfile = _.debounce(function () {
    var user = Meteor.user();
    if (!user)
        return;

    loadUserProfile(user, function (name, picture) {
        if (!name && !picture) {
            return;
        }

        if (user.profile) {
            var sets = {};
            if (name)
                sets["profile.name"] = name;
            if (picture)
                sets["profile.picture"] = picture;
            Meteor.users.update(user, {$set: sets});
        }
        else {
            var profile = {};
            if (name)
                profile.name = name;
            if (picture)
                profile.picture = picture;

            Meteor.users.update(user, {"$set": {profile: profile }});
        }
    });
}, 2000);