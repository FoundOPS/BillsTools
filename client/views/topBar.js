// Top Bar
///////////////////////////////////////////////////////////////////////////////
Template.topBar.rendered = function () {
    var createdCallback = function (){
        $(document).on("popup.visible", function(){
            var frag = Meteor.render(function () {
                return "<p>Recepient: "+Session.get("recipient")+"</p>";
            });

            $("#popupContent")[0].appendChild(frag);

            console.log("Frag: "+frag.innerHTML);
        });
    };

    $("#menu").optionsPopup({
        id: "menu",
        contents: [
            {name: "Logout", id: "logout"}
        ],
        /*onCreate: createdCallback,*/
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
