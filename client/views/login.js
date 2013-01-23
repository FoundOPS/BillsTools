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
        alert("Please use google or facebook login. Custom user sign up is not setup yet. ")
    });
    $("#login-buttons-angies").click(function () {
        alert("Please use google or facebook login. Login with Angie's List not setup yet.")
    });
    $("#login-buttons-quickbooks").click(function () {
        alert("Please use google or facebook login. Login with Quickbooks is not setup yet.")
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
        Meteor.loginWithFacebook({
            requestPermissions: ['email']
        });
    });

    $("#login-buttons-google").click(function () {
        Meteor.loginWithGoogle({
            requestPermissions: ['profile', 'email'],
            requestOfflineToken: true
        });
    });
};