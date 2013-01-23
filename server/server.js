Meteor.publish("directory", function () {
    //TODO filter by current user's team members
    return Meteor.users.find();
});

var MAX_AGE = 60 * 24 * 7; //minutes - 7 days
var oldestMessage = new Date(new Date() - MAX_AGE * 60000);

Meteor.publish("messages", function () {
    //TODO filter by < 7 days ago
    return Messages.find({
        created: {$gte: oldestMessage},
        $or: [
            {author: this.userId},
            {recipient: this.userId}
        ]
    });
});

//NOTE run once in console after reset (or fresh deploy)
//Accounts.loginServiceConfiguration.insert({
//    service: "google",
//    clientId: "960721914827.apps.googleusercontent.com",
//    secret: "keUopZvvXrGBhnfU5kKY9aZ0"
//});
//
//Accounts.loginServiceConfiguration.insert({
//    service: "facebook",
//    appId: "324227897678959",
//    secret: "92f0876e2e21314c6f48556a19d0be91"
//});