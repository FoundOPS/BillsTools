// Top Bar
///////////////////////////////////////////////////////////////////////////////
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

    $("img.logo").on("click", function () {
        CenterOnUsers(true);
    });
};

Template.topBar.destroyed = function () {
    //TODO
};
