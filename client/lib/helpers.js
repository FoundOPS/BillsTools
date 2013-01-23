Handlebars.registerHelper('timeago', function (date) {
    if (date) {
        return $.timeago(date);
    }
    return '';
});

Handlebars.registerHelper('calendarTime', function (date) {
    if (date) {
        return moment(date).calendar();
    }
    return '';
});

/**
 * @return The user's profile image
 */
Handlebars.registerHelper('currentUserImage', function () {
    var user = Meteor.user();

    return userImage(user);
});

/**
 * @param userId The user id
 * @return The user's profile image
 */
Handlebars.registerHelper('userImage', function (userId) {
    var user;
    if (typeof userId === "string") {
        user = Meteor.users.find(userId).fetch()[0];
    }

    return userImage(user);
});