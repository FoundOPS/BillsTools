///////////////////////////////////////////////////////////////////////////////
// Chat

/**
 * Starts the chat
 * @param recipient The id of the recipient
 * @param popup The recipient icon popup
 * @constructor
 */
var StartChat = function (recipient, popup) {
    if (!recipient) return;

    //set the recipient
    var lastRecipient = Session.get("lastRecipient");
    if (typeof lastRecipient !== "undefined" && lastRecipient !== recipient) {
        Session.set("chatInput", "");
    }
    Session.set("recipient", recipient);

    //update isMobileSize before chat is rendered
    var isMobileSize = IsMobileSize();
    Session.set("isMobileSize", isMobileSize);

    //route to chat, this will change the view to mobileChat if it is mobile size
    Meteor.Router.to("/chat");

    //if not mobile size setup the popup
    if (!isMobileSize)
        setupPopup(popup);
};

//when the chat is closed clear the recipient and route to map
var CloseChat = function () {
    console.log("Chat closed");
    Meteor.Router.to("/map");
    Session.set("lastRecipient", Session.get("recipient"));
    Session.set("recipient", null);
};

//sends a message from the text area, and refocuses
var sendMessage = function (textArea) {
    console.log("Message sending");
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

    console.log("chatInput Clear");
    Session.set("chatInput", "");

    textArea.focus();
};

//tracks enter key on text area and when the sender image is clicked (to send a message)
//scrolls to the bottom of the popup
var setupPopup = function (popup) {
    var textArea = $(".chatBox").find("textarea");

    //Note: Can't create delegated event listener due to leaflet limitation. Needs to be set on render.
    var senderImage = $(popup._container).find(".senderImage");
    //whenever the sender image is clicked, send a message
    senderImage.on("click", function () {
        sendMessage(textArea[0]);
    });

    //scrolls to the newest messages (at the bottom) on popup open
    var objDiv = $(popup._container).find(".messages")[0];
    if (objDiv)
        objDiv.scrollTop = objDiv.scrollHeight;
};

var setupMobileChat = function () {
    console.log("chatInput Clear");
    Session.set("chatInput", "");

    console.log("setup mobile chat");
    $(document).on("keyup", ".chatBox textarea", function (e) {
        console.log("chatInput Set: " + $(this).val());
        Session.set("chatInput", $(this).val());
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            sendMessage(this);
        }
    });

    //whenever the sender image is clicked, send a message
    $(document).on("click", ".chatBox .senderImage", function () {
        sendMessage($(".chatBox textarea")[0]);
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
        return DisplayName(recipient[0]);
    return "";
};

Template.chat.isMobileSize = function () {
    return Session.get("isMobileSize");
};

//Returns if the userId is the current user
Template.chat.iAm = function (userId) {
    return Meteor.userId() === userId;
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

//chat is rendered whenever there is a recipient
//if it is a chat box: clone the chat and update the popup content
Template.chat.rendered = function () {
    console.log("Rendering");
    var isMobileSize = Session.get("isMobileSize");
    if (isMobileSize) return;

    var icon = findIcon(Session.get("recipient"));
    if (!icon || !icon._popup) return;

    //clone the chat
    var clonedChat = $($("#currentChat").clone().outerHTML()).attr("id", "").outerHTML();
    icon._popup.setContent(clonedChat);

    //update the chat value
    var chatInput = Session.get("chatInput");
    //focus first so the cursor is at the end of the value
    $(".chatBox textarea").focus().val(chatInput);

    //re-setup the popup's event handlers
    setupPopup(icon._popup);
    console.log("Done Rendering.");
};

Template.mobileChat.rendered = function () {
    console.log("Mobile chat rendering");
    var chatInput = Session.get("chatInput");
    if (chatInput) {
        //NOTE: Focus is required to set cursor to end of textarea.
        //TODO: Fix jump on android 2.3
        $(".chatBox textarea").focus().val(chatInput);
    }

    //setup jScrollPane
    var jScrollPane = $(".chatBox .messages").jScrollPane({verticalDragMinHeight: 20}).data('jsp');
    if (jScrollPane)
        jScrollPane.scrollToBottom();
    $(".chatBox textarea").focus();
    console.log("Mobile chat Rendered");
};

//automatically scroll to the bottom of the jscroll pane when the page is resized
$(window).resize(function () {
    var jScrollPane = $(".chatBox .messages").data('jsp');
    if (jScrollPane) {
        jScrollPane.reinitialise();
        jScrollPane.scrollToBottom();
    }
});

Template.chat.destroyed = function () {
    console.log("Chat destroying");
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