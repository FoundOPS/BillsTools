// Copyright 2012 FoundOPS LLC. All Rights Reserved.

(function () {
    //This page loads before everything else since it is in lib and starts with a
    //http://stackoverflow.com/questions/10693113/dependencies-between-javascript-files-in-meteor

    $(document).on("pagebeforechange", function (e, data) {
        //do not allow any navigation
        e.preventDefault();
    });

    $(document).on("mobileinit", function () {
        //disable url listening
        $.mobile.linkBindingEnabled = false;
        $.mobile.hashListeningEnabled = false;

        //disable auto initialize page (creates unnecessary blank page)
        //need to manually instantiate jquery widgets
        $.mobile.autoInitializePage = false;
        //need to use document, because document.body might not yet be initialized
        $.mobile.pageContainer = $(document).addClass("ui-mobile-viewport");

        $.mobile.changePage.defaults.showLoadMsg = false;
    });
}());