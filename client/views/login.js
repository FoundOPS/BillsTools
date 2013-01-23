Accounts.ui.config({
    requestPermissions: {
        gmail: ["profile", "email"]
    },
    requestOfflineToken: {
        google: true
    }
});


Template.loginView.rendered = function () {
    $("#login-buttons-signup,#forgot-password-link").click(function () {
        alert("Custom user accounts are not setup yet. Please use google or facebook login for now.")
    });
    $("#login-buttons-angies").click(function () {
        alert("Login with Angie's List not setup yet. Please use google or facebook login for now.")
    });
    $("#login-buttons-quickbooks").click(function () {
        alert("Login with Quickbooks is not setup yet. Please use google or facebook login for now.")
    });

    $("#login-buttons-password").click(function () {
        var userName = $("#login-email").val();
        var password = $("#login-password").val();
        Meteor.loginWithPassword(userName, password, function (error) {
            if (error)
                alert("There was an error with your username or password");
        });
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