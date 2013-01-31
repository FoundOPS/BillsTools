Template.teamSettingsView.rendered = function () {
};

Template.currentTeamSelect.teams = function () {
    return Teams.find().fetch();
};

var setupInviteMember = function () {
    var inviteMemberPopup = $("#inviteMemberPopup");

    inviteMemberPopup.popup({theme: "a", overlayTheme: "a", dismissible: false});

    $("#openInviteMember").on("vclick", function () {
        inviteMemberPopup.popup("open");
    });

    $("#inviteMember").on("vclick", function () {
        //TODO

        inviteMemberPopup.popup("close");
        //clear input
        inviteMemberPopup.find("input").val("");
    });
    $("#closeInviteMember").on("vclick", function () {
        inviteMemberPopup.popup("close");
        inviteMemberPopup.find("input").val("");
    });

    //create email suggestions as they type
    var checkEmail = _.debounce(function () {
        $(this).mailcheck({
            suggested: function (element, suggestion) {
                $("#memberEmailSuggestion span")[0].innerText = suggestion.full;
                $("#memberEmailSuggestion").attr("style", "display:block");
            },
            empty: function (element) {
                $("#memberEmailSuggestion").attr("style", "display:none");
                $("#memberEmailSuggestion span")[0].innerText = "";
            }
        });
    }, 300);
    $("input.email").keyup(checkEmail);

    $("#memberEmailSuggestion span").on("vclick", function () {
        inviteMemberPopup.find(".email").val($(this)[0].innerText);
        $("#memberEmailSuggestion").attr("style", "display:none");
    });
};
var setupAddTeam = function () {
    var newTeamPopup = $("#newTeamPopup");
    newTeamPopup.popup({theme: "a", overlayTheme: "a", dismissible: false});
    $("#openNewTeamPopup").on("vclick", function () {
        newTeamPopup.popup("open");
    });
    $("#addTeam").on("vclick", function () {
        var input = newTeamPopup.find("input");
        var teamName = input.val();

        Teams.insert({name: teamName, administrators: [Meteor.userId()]}, function (error, teamId) {
            if (!error) {
                Session.set("currentTeam", teamId);
            }
        });
        //TODO switch team

        newTeamPopup.popup("close");
        input.val("");
    });
    $("#closeNewTeam").on("vclick", function () {
        newTeamPopup.popup("close");
        newTeamPopup.find("input").val("");
    });
};

//remove remnant popups
var removePopups = function () {
    $("#inviteMemberPopup-screen").empty().remove();
    $("#inviteMemberPopup-popup").empty().remove();
    $("#newTeamPopup-screen").empty().remove();
    $("#newTeamPopup-popup").empty().remove();
};

Template.teamSettingsView.rendered = function () {
    removePopups();
    $("#teamWrapper").trigger("create")
    $.mobile.document.trigger("pageshow");

    setupInviteMember();
    setupAddTeam();

    $("#leaveTeam").on("vclick", function () {
        var answer = confirm("Are you sure you want to leave this team?");
        if (answer) {
            console.log("leave");
        }
    });

    $("#deleteTeam").on("vclick", function () {
        var answer = confirm("Are you sure you want to delete this team?");
        if (answer) {
            console.log("delete");
        }
    });
};

Template.teamSettingsView.destroyed = function () {
    //delay fixes spark flush error
    _.delay(removePopups, 250);
};

Template.teamSettingsView.currentTeam = function () {
    var teamId = Session.get("currentTeam");
    if (!teamId) return; //TODO choose current team (there must be one)

    var team = Teams.findOne(teamId);
    if (!team) return;

    return team.name;
};

Template.membersGrid.statusIs = function (status) {
    return this.Status === status;
};

Template.membersGrid.members = function () {
    var teamId = Session.get("currentTeam");
//    if (!teamId) return;

    var team = Teams.findOne(teamId);
    return team ? [
        {
            Name: "Bob Brown",
            Email: "bbrown@gmail.com",
            Role: "member",
            Status: "Invited"
        },
        {
            Name: "James Peach",
            Email: "peachyclean@gmail.com",
            Role: "admin",
            Status: "Last Login: 11:42am"
        }
    ] : null;
};