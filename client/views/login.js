(function () {

    Template.loginView.rendered = function () {
        $("#login-buttons-signup,#forgot-password-link").on("vclick", function () {
            alert("Please use google or facebook login. Custom user sign up is not setup yet. ")
        });
        $("#login-buttons-angies").on("vclick", function () {
            alert("Please use google or facebook login. Login with Angie's List not setup yet.")
        });
        $("#login-buttons-quickbooks").on("vclick", function () {
            alert("Please use google or facebook login. Login with Quickbooks is not setup yet.")
        });

        $("#login-buttons-password").on("vclick", function () {
            var userName = $("#login-email").val();
            var password = $("#login-password").val();
            Meteor.loginWithPassword(userName, password, function (error) {
                if (error)
                    alert("There was an error with your username or password");
            });
        });

        $("#login-buttons-facebook").on("vclick", function () {
            Meteor.loginWithFacebook({
                requestPermissions: ['email']
            });
        });

        $("#login-buttons-google").on("vclick", function () {
            Meteor.loginWithGoogle({
                requestOfflineToken: true
            });
        });
    };

    Accounts.ui.config({
        requestPermissions: {
            gmail: ["profile", "email"]
        },
        requestOfflineToken: {
            google: true
        }
    });
}());