//subscribe to the messages / users
Meteor.subscribe("directory");
Meteor.subscribe("messages");

Messages = new Meteor.Collection("messages");

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
//        var params = urlParameters();
//        var recipient = params["recipient"];
//        Session.set("recipient", recipient);

        if(Session.get("isMobileSize")){
            return "mobileChat";
        }
        return "mapView";
    }
});

Meteor.startup(function(){
    setupChat();
});

Meteor.startup(function () {
    Meteor.autorun(function () {
        //when the user is logged in: switch to the map and update their image
        if (Meteor.userId()) {
            Meteor.Router.to("/map");
            updateUserProfile();
        }
        //when logged out, switch to login
        else {
            Meteor.Router.to("/login");
        }
    });

    startTracking();

    fixFirefoxCss();
});

var fixFirefoxCss = function () {
    if ($.browser.mozilla) {
        //replace all encoded backslashes with nothing
        $("link").each(function () {
            var link = this;
            if (link.href.indexOf(".css") !== -1) {
                var newHref = link.href.replace(/%5C/g, '');
                link.href = newHref;
            }
        });
    }
};

///////////////////////////////////////////////////////////////////////////////
// Main page ui

Meteor.autorun(function () {
    var currentUserId = Meteor.userId();
    var unreadMessages = Messages.find({read: {$ne: true}, recipient: currentUserId}).count();

    if (unreadMessages)
        document.title = "(" + unreadMessages + ") Bills tools";
    else
        document.title = "Bills tools";
});
