///////////////////////////////////////////////////////////////////////////////
// Chat

//options should include: recipient, text
var createMessage = function (text) {
    var options = {created: new Date(), recipient: Session.get("recipient"), text: text};
    Meteor.call('createMessage', options, function (error, message) {
        if (!error) {
            //TODO update sent status of message
        }
    });
};

var sendMessage = function (textArea) {
    var text = textArea.value;
    createMessage(text);
    textArea.value = "";
    textArea.focus();
};

//track enter on text area & scroll to bottom
var setupPopup = function (popup) {
    var textArea = $(popup._container).find("textarea");

    textArea.keyup(function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            sendMessage(textArea[0]);
        }
    });

    $(popup._container).find(".senderImage").click(function () {
        sendMessage(textArea[0]);
    });

    //scrolls to the newest messages (at the bottom) on popup open
    var objDiv = $(popup._container).find(".messages")[0];
    if (objDiv)
        objDiv.scrollTop = objDiv.scrollHeight;

    textArea.focus();
};

//recipient -> the user currently talking with
Template.chat.recipientName = function () {
    var recipient = Meteor.users.find({_id: Session.get("recipient")}).fetch();
    if (recipient[0])
        return displayName(recipient[0]);
    return "";
};

Template.chat.recipientImage = function () {
    //TODO setup
    return "emptyPerson3.png";
};

Template.chat.senderImage = function () {
    //TODO setup
    return "testImage.png";
};

//Returns if the userId is the current user
Template.chat.iAm = function (userId) {
    return Session.get("currentUser") === userId;
};

Template.chat.messageGroups = function () {
    var messages = Messages.find({
            $or: [
                {author: Session.get("recipient")},
                {recipient: Session.get("recipient")}
            ]},
        {sort: {created: 1}}).fetch();

    //Each message group has:
    //messages: an array of messages
    //author: the author of the messages
    //last: the last message's date
    var messageGroups = [];

    var groupIndex = -1;
    for (var i in messages) {
        var message = messages[i];
        var messageGroup = messageGroups[groupIndex];

        //

        //use the same message group if the author is the same
        //and the last message is within 5 minutes
        if (messageGroup && messageGroup.author === message.author &&
            (new Date(message.created) - new Date(messageGroup.last) < 5 * 60000)) {
            messageGroup.messages.push(message);
            messageGroup.last = message.created;
        } else {
            messageGroups.push({author: message.author, messages: [message], last: message.created});
            groupIndex++;
        }
    }

    return messageGroups;
};

//wait for the map to render
Template.chat.rendered = _.debounce(function () {
    var icon = findIcon(Session.get("recipient"));
    if (!icon || !icon._popup) {
        return;
    }

    var clonedChat = $($("#currentChat").clone().outerHTML()).attr("id", "").outerHTML();
    icon._popup.setContent(clonedChat);
    setupPopup(icon._popup);

    //setup popup
    console.log("rendered chat");
}, 200);