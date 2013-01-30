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
        if (Session.get("isMobileSize")) {
            return "mobileChat";
        }
        return "mapView";
    },
    '/team': function () {
        return "teamView";
    }
});

///////////////////////////////////////////////////////////////////////////////
// Initialization

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

/**
 * Updates the title to the # of unread messages
 */
var updateTitle = function () {
    Meteor.autorun(function () {
        var currentUserId = Meteor.userId();
        var unreadMessages = Messages.find({read: {$ne: true}, recipient: currentUserId}).count();

        if (unreadMessages)
            document.title = "(" + unreadMessages + ") Bills tools";
        else
            document.title = "Bills tools";
    });
};

Meteor.startup(function () {
    Meteor.autorun(function () {
        //when the user is logged in: redirect from the login page to the map
        //and update their image
        if (Meteor.userId()) {
            if (!Meteor.Router.page() || Meteor.Router.page() === "loginView") {
                Meteor.Router.to("/map");
                UpdateUserProfile();
            }
        }
        //when logged out, switch to login
        else {
            Meteor.Router.to("/login");
        }
    });

    StartTracking();

    updateTitle();

    fixFirefoxCss();
});

