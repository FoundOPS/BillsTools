// Messages -- data model
// Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Messages

/*
 Each message is represented by a document in the Messages collection:
 created: Date when it was created
 owner: the id of the user who wrote the message
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

Meteor.methods({
    //options should include: created, recipient, text
    createMessage: function (options) {
        options = options || {};
        if (!(options.created && options.created.getMonth && options.recipient &&
            typeof options.text === "string" && options.text.length))
            throw new Meteor.Error(400, "Required parameter missing");

        var timeDifference = options.created - new Date();
        //if it was created over 24 hours ago, the message is too old
        if (timeDifference > (1000 * 3600 * 24))
            throw new Meteor.Error(413, "Message is too old");

        if (options.text.length > 5000)
            throw new Meteor.Error(413, "Text too long");
        if (!this.userId)
            throw new Meteor.Error(403, "You must be logged in");

        var recipient = Meteor.users.find(options.recipient);
        if (!recipient)
            throw new Meteor.Error(400, "User does not exist");

        return Messages.insert({
            created: options.created,
            owner: this.userId,
            recipient: recipient,
            text: options.text
        });
    }
});

///////////////////////////////////////////////////////////////////////////////
// Users

//var position = function (user) {
//    if (user.profile && user.profile.position)
//        return user.profile.position;
//    return null;
//};

//var contactEmail = function (user) {
//    if (user.emails && user.emails.length)
//        return user.emails[0].address;
//    if (user.services && user.services.facebook && user.services.facebook.email)
//        return user.services.facebook.email;
//    return null;
//};
