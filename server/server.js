Meteor.publish("directory", function () {
    return Meteor.users.find({}, {fields: {profile: 1, username: 1}});
});