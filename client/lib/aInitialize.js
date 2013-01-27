//This page loads before everything else since it is in lib and starts with a
//http://stackoverflow.com/questions/10693113/dependencies-between-javascript-files-in-meteor

$(document).on("mobileinit", function () {
    //disable jQuery page stuff
    $.mobile.ajaxEnabled = false;
    $.mobile.autoInitializePage = false;
    $.mobile.pushStateEnabled = false;
});