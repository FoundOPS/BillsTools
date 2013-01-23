Meteor.publish("directory", function () {
    //TODO filter by current user's team members
    return Meteor.users.find();
});

// Messages -- data model
// Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Messages

/*
 Each message is represented by a document in the Messages collection:
 created: Date when it was created
 author: the id of the user who wrote the message
 recipient: the id of the user the message is written to
 text: the message text
 */
Messages = new Meteor.Collection("messages");

Messages.allow({
    insert: function (userId, message) {
        return false; // no cowboy inserts -- use createMessage method
    },
    update: function (userId, messages, fields, modifier) {
        return false; // no updates
    },
    remove: function (userId, messages) {
        return false; // no deletes
    }
});

var MAX_AGE = 60 * 24 * 7; //in minutes. (7 days)
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

Meteor.methods({
    //options should include: created, recipient, text
    createMessage: function (options) {
        options = options || {};
        if (!(options.recipient &&
            typeof options.text === "string" && options.text.length))
            throw new Meteor.Error(400, "Required parameter missing");

        if (options.text.length > 5000)
            throw new Meteor.Error(413, "Text too long");
        if (!this.userId)
            throw new Meteor.Error(403, "You must be logged in");

        var created = new Date();

        var recipientUser = Meteor.users.find(options.recipient);
        if (!recipientUser)
            throw new Meteor.Error(400, "User does not exist");

        return Messages.insert({
            created: created,
            author: this.userId,
            recipient: options.recipient,
            text: options.text
        });
    }
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