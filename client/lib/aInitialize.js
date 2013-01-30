//This page loads before everything else since it is in lib and starts with a
//http://stackoverflow.com/questions/10693113/dependencies-between-javascript-files-in-meteor

$(document).on("mobileinit", function () {
    //disable jQuery page stuff
    $.mobile.ajaxEnabled = false;
    $.mobile.autoInitializePage = false;
    $.mobile.pushStateEnabled = false;

    //required for many listeners (popup closing when you click outside of it)
    //if not set and there is not a first page, there will be errors
    $.mobile.pageContainer = $(document.body).addClass("ui-mobile-viewport");
});