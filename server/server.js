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