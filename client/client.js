//subscribe to the messages / users
Meteor.subscribe("directory");
Meteor.subscribe("messages");

///////////////////////////////////////////////////////////////////////////////
// General

Meteor.Router.add({
    '/login': function () {
        return "loginView";
    },
    '/map': function () {
        return "mapView";
    },
    '/chat': function () {
//        //TODO if mobile, set mobileView
//        var params = urlParameters();
//        var recipient = params["recipient"];
//        Session.set("recipient", recipient);
    }
});

Meteor.startup(function () {
    Meteor.autorun(function () {
        //when the user is logged in: switch to the map and update their image
        if (Meteor.userId()) {
            Meteor.Router.to("/map");
            updateUserImage();
        }
        //when logged out, switch to login
        else {
            Meteor.Router.to("/login");
        }
    });

    startTracking();
});