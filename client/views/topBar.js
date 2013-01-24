// Top Bar
///////////////////////////////////////////////////////////////////////////////
Template.topBar.unreadCount = function () {
    var currentUserId = Meteor.userId();

    return Messages.find({read: {$ne: true}, recipient: currentUserId}).count();
};

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
        centerOnUsers(true);
    });
};

Template.topBar.destroyed = function () {
    //TODO
};
