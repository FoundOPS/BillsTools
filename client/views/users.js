///////////////////////////////////////////////////////////////////////////////
// Users

Accounts.ui.config({
    requestPermissions: {
        gmail: ["profile", "email"]
    },
    requestOfflineToken: {
        google: true
    }
});

Meteor.autorun(function () {
    var user = Meteor.user();
    if (user)
        Session.set("currentUser", user._id);
    else
        Session.set("currentUser", null);
});

var displayName = function (user) {
    if (!user)
        return "";

    if (user.profile && user.profile.name)
        return user.profile.name;

    if (user.emails && user.emails[0])
        return user.emails[0].address;

    if (user.services && user.services.google && user.services.google.email)
        return user.services.google.email;

    return "test";
};