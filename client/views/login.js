var useGoogleFacebook = function () {
    alert("Please use google or facebook login for now. This feature is not setup.")
};

Accounts.ui.config({
    requestPermissions: {
        gmail: ["profile", "email"]
    },
    requestOfflineToken: {
        google: true
    }
});


Template.loginView.rendered = function () {
    $("#login-buttons-password,#login-buttons-signup,#forgot-password-link,#login-buttons-angies,#login-buttons-quickbooks").click(function () {
        useGoogleFacebook();
    });

    $("#login-buttons-facebook").click(function () {
        Meteor.loginWithFacebook();
    });

    $("#login-buttons-google").click(function () {
        Meteor.loginWithGoogle({
            requestPermissions: ['profile', 'email'],
            requestOfflineToken: true
        });
    });
};