Meteor.publish("directory", function () {
    //TODO filter by current user's team members
    return Meteor.users.find();
});

///////////////////////////////////////////////////////////////////////////////
// Messages

/*
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
    //only send messages < 7 days old and where the user is either the author or recipient
    return Messages.find({
        created: {$gte: oldestMessage},
        $or: [
            {author: this.userId},
            {recipient: this.userId}
        ]
    });
});

var messageMethods = {
    //options should include: recipient, text
    createMessage: function (options) {
        options = options || {};

        if (!ContainsRequiredFields(options, ['recipient', 'text']) ||
            typeof options.text !== "string" || !options.text.length)
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
        var message = Messages.findOne(id);
        if (!message)
            throw new Meteor.Error(400, "Message does not exist");

        if (message.recipient !== this.userId)
            throw new Meteor.Error(403, "Can only read messages sent to you");

        return Messages.update({_id: id}, {$set: {read: true}});
    }
};

///////////////////////////////////////////////////////////////////////////////
// Teams

/*
 created: Date when it was created
 author: the id of the user who wrote the message
 recipient: the id of the user the message is written to
 text: the message text
 */
Teams = new Meteor.Collection("teams");

Teams.allow({
    insert: function (userId, team) {
        //TODO make sure the team is correctly inserted / switch to method instead
        //make sure the user is an administrator
        return _.contains(team.administrators, userId);
    },
    update: function (userId, team, fields, modifier) {
        return false; // no updates - use changeName instead
    },
    remove: function (userId, messages) {
        //TODO
        return false; // no deletes
    }
});

var teamMethods = {
    updateName: function (id, name) {
        var team = Teams.findOne(id);
        if (!team)
            throw new Meteor.Error(400, "Team does not exist");

        if (!_.contains(team.administrators, this.userId))
            throw new Meteor.Error(403, "Need to be an administrator to change a team");

        if (typeof name !== "string" || !name.length)
            throw new Meteor.Error(400, "Team name must be at least 1 letter");

        return Teams.update({_id: id}, {$set: {name: name}});
    }
};

Meteor.publish("teams", function () {
    return Teams.find({
        $or: [
            {administrators: this.userId},
            {members: this.userId}
        ]
    });
});

///////////////////////////////////////////////////////////////////////////////
// Invitations

//TODO
//options should include: team (id), member (email)
//inviteMember: function (options) {
//    options = options || {};
//
//    if (!ContainsRequiredFields(options, ['team', 'member']))
//        throw new Meteor.Error(400, "Required parameter missing");
//
//    var team = Teams.findOne(options.team);
//    if (!team)
//        throw new Meteor.Error(400, "Team does not exist");
//
//    if (!this.userId)
//        throw new Meteor.Error(403, "You must be logged in");
//
//    if (!_.contains(team.administrators, this.userId))
//        throw new Meteor.Error(403, "You must be an administrator to this team");
//
//    //TODO invite member, add new Invite. unique key, set expiration 7 days from now
//    Teams.update({_id: team._id}, {$push: {memberInvitations: NOTE (invitation._id)}});
//},

///////////////////////////////////////////////////////////////////////////////
// Initialization

var allMethods = {};
_.extend(allMethods, messageMethods);
_.extend(allMethods, teamMethods);

Meteor.methods(allMethods);

//PUBLISH TODO comment out
Meteor.startup(function () {
    if (Accounts.loginServiceConfiguration.find().count() < 1) {
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
    }
});

//below run once on the client
//Accounts.createUser({
//    username: "Jonathan Perl",
//    email: "ab@c.com",
//    password: "123456"
//});

//sets up a new team for the current user
//UpdateCurrentTeam(Teams.insert({name: "Team Awesome", administrators: [Meteor.userId()]}));

