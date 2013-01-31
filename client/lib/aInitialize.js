//This page loads before everything else since it is in lib and starts with a
//http://stackoverflow.com/questions/10693113/dependencies-between-javascript-files-in-meteor

$(document).on("pagebeforechange", function (e, data) {
    //prevent navigating to nothing (weird jquery mobile bug)
    if (_.isString(data.toPage))
        e.preventDefault();
});

$(document).on("mobileinit", function () {
    //disable url listening
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;

    //disable auto initialize page (creates unnecessary blank page)
    //when rendering a jquery mobile page, need to call SetupMobilePage
    $.mobile.autoInitializePage = false;
    $.mobile.pageContainer = $(document.body).addClass("ui-mobile-viewport");
});