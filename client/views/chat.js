///////////////////////////////////////////////////////////////////////////////
// Chat

//Creates a message in the collection. options should include: recipient, text
var createMessage = function (text) {
    var options = {recipient: Session.get("recipient"), text: text};
    Meteor.call('createMessage', options, function (error, message) {
        if (!error) {
            //TODO update sent status of message?
        }
    });
};

//sends a message from the text area, and refocuses
var sendMessage = function (textArea) {
    var text = textArea.value;
    //create message if it's not blank
    if (text != "\n") {
        createMessage(text);
    }
    textArea.value = "";
    textArea.focus();
};

//track enter on text area & scroll to bottom
var setupPopup = function (popup) {
    //var textArea = $(popup._container).find("textarea");
    var textArea = $(".chatBox").find("textarea");

    $(popup._container).find(".senderImage").click(function () {
        sendMessage(textArea[0]);
    });

    //scrolls to the newest messages (at the bottom) on popup open
    var objDiv = $(popup._container).find(".messages")[0];
    if (objDiv)
        objDiv.scrollTop = objDiv.scrollHeight;

    textArea.focus();
};

var setupChat = function () {
    console.log("Setting up.");
    $(document).on("keyup", ".chatBox textarea", function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            sendMessage(this);
            //$(".chatBox textarea").focus();
            //hideKeyboard($(this));
        }
    });


    $(document)
        .on("click", "#closeChatMobile", function () {
            Meteor.Router.to("/map");
        })
        .on('touchstart mousedown', '#closeChatMobile',
        function () {
            $(this).css({backgroundColor: "#7fbb00"});
        }
    )
        .on('touchend mouseup mouseout', '#closeChatMobile',
        function () {
            $(this).css({backgroundColor: ""});
        }
    );
};

//recipient -> the user currently talking with
Template.chat.recipient = function () {
    return Session.get("recipient");
};

Template.chat.recipientName = function () {
    console.log("Getting recipientName.");
    var recipient = Meteor.users.find({_id: Session.get("recipient")}).fetch();
    if (recipient[0])
        return displayName(recipient[0]);
    console.log("None Found.");
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
                    } else {
                        console.log("Read");
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

//wait for the map to render
//Debounce immediate param set to true to immediately focus textarea and scroll to bottom of div. Required for mobile view.
Template.chat.rendered = _.debounce(function () {
    console.log("Rendering");

    var isMobileSize = Session.get("isMobileSize");
    if (isMobileSize) {
        var scrollPane = $(".chatBox .messages");
        scrollPane.jScrollPane({verticalDragMinHeight: 20});
        $(window).bind(
            'resize',
            function () {
                var api = scrollPane.data('jsp');
                var throttleTimeout;
                if ($.browser.msie) {
                    if (!throttleTimeout) {
                        throttleTimeout = setTimeout(function () {
                            api.reinitialise();
                            throttleTimeout = null;
                        }, 50);
                    }
                } else {
                    api.reinitialise();
                }
            }
        );

        scrollPane.data('jsp').scrollToBottom();
        //TODO: Make following a fallback if jsp was not initialized.
        scrollPane.animate({
            scrollTop: (scrollPane[0].scrollHeight - scrollPane.height())
        }, 0);
        $(".chatBox textarea").focus();
    }

    var icon = findIcon(Session.get("recipient"));
    if (!icon || !icon._popup) {
        return;
    }

    var clonedChat = $($("#currentChat").clone().outerHTML()).attr("id", "").outerHTML();
    icon._popup.setContent(clonedChat);
    setupPopup(icon._popup);

    //setup popup
    console.log("rendered chat");
}, 200, true);

Template.chat.destroyed = function () {
    if (messagesCursorHandle) {
        messagesCursorHandle.stop();
        messagesCursorHandle = null;
    }
};