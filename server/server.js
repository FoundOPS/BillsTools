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
        return false; // no updates -- use readMessage instead
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
    },
    readMessage: function (id) {
        var message = Messages.find(id).fetch()[0];
        if (!message)
            throw new Meteor.Error(400, "Message does not exist");

        if (message.recipient !== this.userId)
            throw new Meteor.Error(403, "Can only read messages sent to you");

        return Messages.update({_id: id}, {$set: {read: true}});
    }
});

//PUBLISH TODO comment out
Meteor.startup(function () {
    if (Accounts.loginServiceConfiguration.find().count() > 0)
        return;

    Accounts.loginServiceConfiguration.insert({
        service: "google",
        clientId: "960721914827.apps.googleusercontent.com",
        secret: "keUopZvvXrGBhnfU5kKY9aZ0"
    });

    Accounts.loginServiceConfiguration.insert({
        service: "facebook",
        appId: "421885287896331",
        secret: "5a4ff7bedc49b8c071c2e198a04d6ec7"
    });

    //Accounts.createUser({
    //    username: "Jonathan Perl",
    //    email : "ab@c.com",
    //    password: "123456"
    //});
});

