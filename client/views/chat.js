///////////////////////////////////////////////////////////////////////////////
// Chat

/**
 * Starts the chat
 * @param recipient The id of the recipient
 * @param popup The recipient icon popup
 * @constructor
 */
var StartChat = function (recipient, popup) {
    //set the recipient
    Session.set("recipient", recipient);

    //update isMobileSize before chat is rendered
    var isMobileSize = IsMobileSize();
    Session.set("isMobileSize", isMobileSize);

    //route to chat, this will change the view to mobileChat if it is mobile size
    Meteor.Router.to("/chat");

    //TODO remove
    //if not mobile size setup the popup
    if (!isMobileSize) {
        setupPopup(popup);

        //show popup after a slight delay to let content be set first
        Meteor.setTimeout(function () {
            $(".leaflet-popup").addClass("show"); //(it will override hidden)
        }, 250);
    }
};

//when the chat is closed clear the recipient and route to map
var CloseChat = function () {
    Meteor.Router.to("/map");
    Session.set("recipient", null);
};

//sends a message from the text area, and refocuses
var sendMessage = function (textArea) {
    var text = textArea.value;
    //create message if it's not blank
    if (text != "\n") {
        //Create a message in the collection. options should include: recipient, text
        var options = {recipient: Session.get("recipient"), text: text};
        Meteor.call('createMessage', options, function (error, message) {
            if (!error) {
                //TODO update sent status of message?
            }
        });
    }
    textArea.value = "";
    textArea.focus();
};

//tracks enter key on text area and when the sender image is clicked (to send a message)
//scrolls to the bottom of the popup
var setupPopup = function (popup) {
    //var textArea = $(popup._container).find("textarea");
    var textArea = $(".chatBox").find("textarea");

    //scrolls to the newest messages (at the bottom) on popup open
    var objDiv = $(popup._container).find(".messages")[0];
    if (objDiv)
        objDiv.scrollTop = objDiv.scrollHeight;
    textArea.focus();
};

var setupMobileChat = function () {
    $(document).on("keyup", ".chatBox textarea", function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            sendMessage(this);
            //hideKeyboard($(this));
        }
    });

    //whenever the sender image is clicked, send a message
    $(document).on("click", ".chatBox .senderImage", function () {
        sendMessage($(".chatBox textarea")[0]);
        //hideKeyboard($(this));
    });

    $(document)
        .on("click", "#closeChatMobile", function () {
            CloseChat();
            //need to recenter after the view reloads
            CenterOnUsers(true, true, true);
        })
        //sets up hover on close chat mobile (for Android 2.3)
        .on('touchstart mousedown', '#closeChatMobile', function () {
            $(this).css({backgroundColor: "#7fbb00"});
        })
        .on('touchend mouseup mouseout', '#closeChatMobile', function () {
            $(this).css({backgroundColor: ""});
        }
    );
};

///////////////////////////////////////////////////////////////////////////////
// Templates

//recipient -> the user currently talking with
Template.chat.recipient = function () {
    return Session.get("recipient");
};

Template.chat.recipientName = function () {
    var recipient = Meteor.users.find({_id: Session.get("recipient")}).fetch();
    if (recipient[0])
        return displayName(recipient[0]);
    return "";
};

Template.chat.isMobileSize = function () {
    return Session.get("isMobileSize");
};

//Returns if the userId is the current user
Template.chat.iAm = function (userId) {
    return Session.get("currentUser") === userId;
};

var messagesCursorHandle;
Template.chat.messageGroups = function () {
    var messagesCursor = Messages.find({
            $or: [
                {author: Session.get("recipient")},
                {recipient: Session.get("recipient")}
            ]},
        {sort: {created: 1}});

    if (messagesCursorHandle) {
        messagesCursorHandle.stop();
    }
    messagesCursorHandle = messagesCursor.observe({
        added: function (message) {
            //if a chat window is open (there is a recipient): mark all the messages from the recipient as read
            var recipient = Session.get("recipient");
            if (recipient && message.recipient === Meteor.userId() && !message.read) {
                Meteor.call('readMessage', message._id, function (error) {
                    if (error) {
                        //TODO error handling
                        console.log(error);
                    }
                });
            }
        }
    });

    var messages = messagesCursor.fetch();
    //Each message group has:
    //messages: an array of messages
    //author: the author of the messages
    //last: the last message's date
    var messageGroups = [];

    var groupIndex = -1;
    for (var i in messages) {
        var message = messages[i];
        var messageGroup = messageGroups[groupIndex];

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

//chat is rendered whenever there is a recipient which means a chat box or the chat view is open
Template.chat.rendered = _.debounce(function () {
    var isMobileSize = Session.get("isMobileSize");
    if (isMobileSize)
        return;

    var icon = findIcon(Session.get("recipient"));
    if (!icon || !icon._popup) {
        return;
    }

    var clonedChat = $($("#currentChat").clone().outerHTML()).attr("id", "").outerHTML();
    icon._popup.setContent(clonedChat);

    //TODO remove
    setupPopup(icon._popup);
}, 250);

Template.mobileChat.rendered = _.debounce(function () {
    //setup jScrollPane
    var jScrollPane = $(".chatBox .messages").jScrollPane({verticalDragMinHeight: 20}).data('jsp');
    if (jScrollPane)
        jScrollPane.scrollToBottom();
    $(".chatBox textarea").focus();
});

//automatically scroll to the bottom of the jscroll pane when the page is resized
$(window).resize(function () {
    var jScrollPane = $(".chatBox .messages").data('jsp');
    if (jScrollPane) {
        jScrollPane.reinitialise();
        jScrollPane.scrollToBottom();
    }
});

Template.chat.destroyed = function () {
    if (messagesCursorHandle) {
        messagesCursorHandle.stop();
        messagesCursorHandle = null;
    }
};

///////////////////////////////////////////////////////////////////////////////
// Initialization

Meteor.startup(function () {
    setupMobileChat();
});