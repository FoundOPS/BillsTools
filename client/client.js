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

Meteor.autorun(function () {
    //when the user is logged in, switch to the map
    if (Meteor.user()) {
        Meteor.Router.to("/map");
// Top Bar

Template.topBar.rendered = function () {
    $("#menu").optionsPopup({
        id: "menu",
        contents: [
            {name: "Logout", id: "logout"}
        ],
        disableHeader: true
    });

    $("#logout").live("click", function (e) {
        Meteor.logout();
    });
};

///////////////////////////////////////////////////////////////////////////////
    }
    //when logged out, switch to login
    else {
        Meteor.Router.to("/login");
    }
});