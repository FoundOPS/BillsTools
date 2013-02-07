// Copyright 2012 FoundOPS LLC. All Rights Reserved.

var USERS = (function () {
    var my = {};

///////////////////////////////////////////////////////////////////////////////
// Users

    my.DisplayName = function (user) {
        if (!user)
            return "";

        if (user.profile && user.profile.name)
            return user.profile.name;

        return my.Email(user);
    };

    my.Email = function (user) {
        if (user.emails && user.emails[0])
            return user.emails[0].address;

        if (user.services && user.services.google && user.services.google.email)
            return user.services.google.email;

        if (user.services && user.services.facebook && user.services.facebook.email)
            return user.services.facebook.email;
    };

    //generates a users image, a users initials, or a blank image, based on the available data
    my.UserPictureElement = function (user, useBlankImage) {
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

    //Update the current user's profile information from the provider (FB, Google)
    //currents updates name and picture (if available)
    //TODO remove, make this part of initial account sign up
    my.UpdateUserProfile = _.debounce(function () {
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
        });
    }, 2000);

    my.UpdateCurrentTeam = function (selectedTeam) {
        if (!selectedTeam) return;
        var user = Meteor.user();
        if (user.profile && user.profile.currentTeam === selectedTeam) return;
        Meteor.users.update(user, {"$set": {"profile.currentTeam": selectedTeam }});
    };

    /**
     * @return The user's profile image
     */
    Handlebars.registerHelper('currentUserPictureElement', function (useBlankImage) {
        var user = Meteor.user();

        return my.UserPictureElement(user, useBlankImage);
    });

    /**
     * @param userId The user id
     * @return The user's profile image
     */
    Handlebars.registerHelper('userPictureElement', function (userId, useBlankImage) {
        var user;
        if (typeof userId === "string") {
            user = Meteor.users.find(userId).fetch()[0];
        }

        return my.UserPictureElement(user, useBlankImage);
    });

    /**
     * Load the user image from their Facebook or Google
     * @param user The user to load
     * @param callback Returns the name and image as parameters (if it was successful)
     */
    function loadUserProfile(user, callback) {
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
    }

    return my;
}());