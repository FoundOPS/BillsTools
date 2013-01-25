// Top Bar
///////////////////////////////////////////////////////////////////////////////
Template.topBar.rendered = function () {
    $("#menu").optionsPopup({
        id: "menu",
        contents: [
            {name: "Logout", id: "logout"},
            {name: "Team Settings", id: "teamSettings"}
        ],
        disableHeader: true
    });

    $("#logout").live("click", function () {
        Meteor.logout();
    });

    $("#teamSettings").live("click", function () {
        Meteor.Router.to("/team");
    });

    $("img.logo").on("click", function () {
        //if already on map view, center on users. Otherwise, got to map view.
        if (Meteor.Router.page() === "mapView") {
            CenterOnUsers(true);
        } else{
            Meteor.Router.to("/map");
        }
    });
};

Template.topBar.destroyed = function () {
    //TODO
};
