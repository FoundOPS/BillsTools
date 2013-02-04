var CHAT = (function () {
    var my = {};

///////////////////////////////////////////////////////////////////////////////
// Chat

    /**
     * Starts the chat
     * @param recipient The id of the recipient
     * @param popup The recipient icon popup
     * @constructor
     */
    my.StartChat = function (recipient, popup) {
        if (!recipient) return;

        //set the recipient
        var lastRecipient = Session.get("lastRecipient");
        if (typeof lastRecipient !== "undefined" && lastRecipient !== recipient) {
            Session.set("chatInput", "");
        }
        Session.set("recipient", recipient);

        //update isMobileSize before chat is rendered
        var isMobileSize = TOOLS.IsMobileSize();
        Session.set("isMobileSize", isMobileSize);

        //route to chat, this will change the view to mobileChat if it is mobile size
        Meteor.Router.to("/chat");

        //if not mobile size setup the popup
        if (!isMobileSize)
            setupPopup(popup);
    };

    //when the chat is closed clear the recipient and route to map
    my.CloseChat = function () {
        Meteor.Router.to("/map");
        Session.set("lastRecipient", Session.get("recipient"));
        Session.set("recipient", null);
    };

    //sends a message from the text area, and refocuses
    function sendMessage (textArea) {
        var text = textArea.value;
        //create message if it's not blank
        if (text != "\n" && text.length > 0) {
            //Create a message in the collection. options should include: recipient, text
            var options = {recipient: Session.get("recipient"), text: text};
            Meteor.call('createMessage', options, function (error, message) {
                if (!error) {
                    //TODO update sent status of message?
                }
            });
        }
        textArea.value = "";

        Session.set("chatInput", "");

        textArea.focus();
    }

    //tracks enter key on text area and when the sender image is clicked (to send a message)
    //scrolls to the bottom of the popup
    function setupPopup (popup) {
        var textArea = $(".chatBox").find("textarea");

        //Note: Can't create delegated event listener due to leaflet limitation. Needs to be set on render.
        var senderImage = $(popup._container).find(".senderImage");
        //whenever the sender image is clicked, send a message
        senderImage.on("vclick", function () {
            sendMessage(textArea[0]);
        });

        //scrolls to the newest messages (at the bottom) on popup open
        var objDiv = $(popup._container).find(".messages")[0];
        if (objDiv)
            objDiv.scrollTop = objDiv.scrollHeight;
    }

    function setupMobileChat () {
        Session.set("chatInput", "");

        $(document).on("keyup", ".chatBox textarea", function (e) {
            Session.set("chatInput", $(this).val());
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13) {
                sendMessage(this);
            }
        });

        //whenever the sender image is clicked, send a message
        $(document).on("vclick", ".chatBox .senderImage", function () {
            sendMessage($(".chatBox textarea")[0]);
        });

        $(document)
            .on("vclick", "#closeChatMobile", function () {
                my.CloseChat();
                //need to recenter after the view reloads
                MAP.CenterOnUsers(true, true, true);
            })
            //sets up hover on close chat mobile (for Android 2.3)
            .on('touchstart mousedown', '#closeChatMobile', function () {
                $(this).css({backgroundColor: "#7fbb00"});
            })
            .on('touchend mouseup mouseout', '#closeChatMobile', function () {
                $(this).css({backgroundColor: ""});
            }
        );
    }

    //automatically scroll to the bottom of the jscroll pane when the page is resized
    $(window).resize(function () {
        var jScrollPane = $(".chatBox .messages").data('jsp');
        if (jScrollPane) {
            jScrollPane.reinitialise();
            jScrollPane.scrollToBottom();
        }
    });

///////////////////////////////////////////////////////////////////////////////
// Templates

    //chat is rendered whenever there is a recipient
    //if it is a chat box: clone the chat and update the popup content
    Template.chat.rendered = function () {
        var isMobileSize = Session.get("isMobileSize");
        if (isMobileSize) return;

        var icon = MAP.FindIcon(Session.get("recipient"));
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
    };

    Template.mobileChat.rendered = function () {
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
    };

    Template.chat.destroyed = function () {
        if (messagesCursorHandle) {
            messagesCursorHandle.stop();
            messagesCursorHandle = null;
        }
    };

    //recipient -> the user currently talking with
    Template.chat.recipient = function () {
        return Session.get("recipient");
    };

    Template.chat.recipientName = function () {
        var recipient = Meteor.users.find({_id: Session.get("recipient")}).fetch();
        if (recipient[0])
            return USERS.DisplayName(recipient[0]);
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

///////////////////////////////////////////////////////////////////////////////
// Initialization
    console.log("Rendering");
    console.log("Done Rendering.");
    console.log("Mobile chat rendering");
    console.log("Mobile chat Rendered");

    $(document).on("mobileinit", function () {
        // Reference: http://jquerymobile.com/demos/1.1.0/docs/api/globalconfig.html
        $.extend($.mobile, {
            linkBindingEnabled: false,
            ajaxEnabled: false
        });
    });

    //TODO: why is .ui-loader showing up(now it's just being hidden in css)
    console.log("Chat destroying");

    Meteor.startup(function () {
        setupMobileChat();
    });

    return my;
}());