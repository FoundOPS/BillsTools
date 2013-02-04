(function () {

    //subscribe to the messages / users / teams
    Meteor.subscribe("directory");
    Meteor.subscribe("messages");
    Meteor.subscribe("teams");

    Messages = new Meteor.Collection("messages");

    Teams = new Meteor.Collection("teams");

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
        '/teamSettings': function () {
            return "teamSettingsView";
        }
    });

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization

    function fixFirefoxCss () {
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
    }

    /**
     * Updates the title to the # of unread messages
     */
    function updateTitle () {
        Meteor.autorun(function () {
            var currentUserId = Meteor.userId();
            var unreadMessages = Messages.find({read: {$ne: true}, recipient: currentUserId}).count();

            if (unreadMessages)
                document.title = "(" + unreadMessages + ") Bills tools";
            else
                document.title = "Bills tools";
        });
    }

    //store the user's current team in session data
    function syncCurrentTeam () {
        Meteor.autorun(function () {
            var user = Meteor.user();
            if (user && user.profile && user.profile.currentTeam) {
                Session.set("currentTeam", user.profile.currentTeam);
            }
            else {
                Session.set("currentTeam", null);
            }
        });
    }

    Meteor.startup(function () {
        Meteor.autorun(function () {
            //when the user is logged in: redirect from the login page to the map
            //and update their image
            if (Meteor.userId()) {
                if (!Meteor.Router.page() || Meteor.Router.page() === "loginView") {
                    Meteor.Router.to("/map");
                    USERS.UpdateUserProfile();
                }
            }
            //when logged out, switch to login
            else {
                Meteor.Router.to("/login");
            }
        });

        syncCurrentTeam();

        TRACKING.StartTracking();

        updateTitle();

        fixFirefoxCss();
    });
}());