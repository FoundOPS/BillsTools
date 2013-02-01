//TODO when first load choose current team, set users current team

Template.currentTeamSelect.teams = function () {
    return Teams.find().fetch();
};

var setupInviteMember = function () {
    var inviteMemberPopup = $("#inviteMemberPopup");

    inviteMemberPopup.popup({theme: "a", overlayTheme: "a", dismissible: false});

    $("#openInviteMember").on("vclick", function () {
        inviteMemberPopup.popup("open");
    });

    $("#inviteMember").on("click", function () {
        //TODO

        inviteMemberPopup.popup("close");
        //clear input
        inviteMemberPopup.find("input").val("");
    });
    $("#closeInviteMember").on("click", function () {
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
    $("#addTeam").on("click", function () {
        var input = newTeamPopup.find("input");
        var teamName = input.val();

        Teams.insert({name: teamName, administrators: [Meteor.userId()]}, function (error, teamId) {
            if (!error) {
                setCurrentTeam(teamId);
            }
        });
        //TODO switch team

        newTeamPopup.popup("close");
        input.val("");
    });
    $("#closeNewTeam").on("click", function () {
        newTeamPopup.popup("close");
        newTeamPopup.find("input").val("");
    });
};

var setCurrentTeam = function (selectedTeam) {
    //TODO remove after confirming
    if (!selectedTeam)
        alert("need to fix this. should not be possible");

    Meteor.users.update(Meteor.user(), {"$set": {"profile.currentTeam": selectedTeam }});
};

//remove remnant popups
var removePopups = function () {
    $("#inviteMemberPopup-screen").empty().remove();
    $("#inviteMemberPopup-popup").empty().remove();
    $("#newTeamPopup-screen").empty().remove();
    $("#newTeamPopup-popup").empty().remove();
};

Template.teamSettingsView.events = {
    'click #currentTeam': function (event) {
        var selectedTeam = $(event.currentTarget).find(':selected').val();
        setCurrentTeam(selectedTeam);
    },
    'click #memberRole': function (event) {
        var select = $(event.currentTarget);

        var selectedRole = select.find(':selected').val();
        var member = select.data("id");

        //TODO
        console.log("member " + member + " change role to " + selectedRole);
    }
};

Template.teamSettingsView.rendered = function () {
    removePopups();
    $("#teamWrapper").trigger("create");

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

var currentTeam = function () {
    var teamId = Session.get("currentTeam");
    if (!teamId) return; //TODO choose current team (there must be one)

    var team = Teams.findOne(teamId);
    if (!team) return;

    return team;
};

Handlebars.registerHelper('isCurrentTeamSelected', function (id) {
    if (Session.get("currentTeam") === id)
        return "selected";
});

Template.teamSettingsView.currentTeam = function () {
    var team = currentTeam();
    if (team) return team.name;
};

Template.membersGrid.statusIs = function (status) {
    return this.Status === status;
};

Template.membersGrid.members = function () {
    var team = currentTeam();
    if (!team) return;

    var users = Meteor.users.find({_id: {$in: team.administrators}}).fetch();

//role: "member",
//status: "Last Login: 11:42am"

    var members = _.map(users, function (user) {
        return {id: user._id, name: DisplayName(user), email: Email(user), role: "admin", status: "Invited"};
    });

    return members;
};

