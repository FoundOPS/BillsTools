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
};

/**
 * @param user
 * @return {String} the user image url
 */
var userImage = function (user) {
    if (user && user.profile && user.profile.picture)
        return user.profile.picture;

    return "emptyPerson3.png";
};

/**
 * Load the user image from their Facebook or Google
 * @param user The user to load
 * @param callback Returns the image as a parameter (if it was succesful)
 */
var loadUserImage = function (user, callback) {
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
            fields: "picture.width(32).height(32)",
            access_token: fb.accessToken
        };

        processor = function (profile) {
            var notSet = profile.picture.data.is_silhouette;
            if (notSet)
                return;

            callback(profile.picture.data.url);
        };
    }
    else if (goog) {
        url = "https://www.googleapis.com/oauth2/v1/userinfo";

        data = {
            access_token: goog.accessToken
        };

        processor = function (profile) {
            callback(profile.picture);
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

//Update the current user's image
var updateUserImage = _.debounce(function () {
    var user = Meteor.user();
    if (!user)
        return;

    loadUserImage(user, function (image) {
        if (!image)
            return;

        if (!user.profile) {
            var profile = {
                picture: image
            };

            Meteor.users.update(user, {"$set": {"profile": profile }});
        } else {
            Meteor.users.update(user, {"$set": {"profile.picture": image }});
        }
    });
}, 2000);