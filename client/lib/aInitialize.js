//This page loads before everything else since it is in lib and starts with a
//http://stackoverflow.com/questions/10693113/dependencies-between-javascript-files-in-meteor

$(document).on("mobileinit", function () {
    //disable url listening. use change page manually
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
});