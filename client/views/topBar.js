(function () {

// Top Bar
///////////////////////////////////////////////////////////////////////////////
    Template.topBar.rendered = function () {
        $("#menu").optionsPopover({
            id: "menu",
            contents: [
                {name: "Team Settings", id: "teamSettings"},
                {name: "Logout", id: "logout"}
            ],
            disableHeader: true
        });

        $("#logout").live("vclick", function () {
            Meteor.logout();
        });

        $("#teamSettings").live("vclick", function () {
            Meteor.Router.to("/teamSettings");
        });

        $("img.logo").on("vclick", function () {
            //if already on map view, center on users. Otherwise, got to map view.
            if (Meteor.Router.page() === "mapView") {
                MAP.CenterOnUsers(true);
            } else{
                Meteor.Router.to("/map");
            }
        });
    };

    Template.topBar.destroyed = function () {
        //TODO
    };
}());