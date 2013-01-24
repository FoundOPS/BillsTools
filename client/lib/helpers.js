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
Handlebars.registerHelper('currentUserPictureElement', function (useBlankImage) {
    var user = Meteor.user();

    return userPictureElement(user, useBlankImage);
});

/**
 * @param userId The user id
 * @return The user's profile image
 */
Handlebars.registerHelper('userPictureElement', function (userId, useBlankImage) {
    var user;
    if (typeof userId === "string") {
        user = Meteor.users.find(userId).fetch()[0];
    }

    return userPictureElement(user, useBlankImage);
});