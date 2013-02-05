(function () {
    var popups = ["inviteMemberPopup", "newTeamPopup", "renameTeamPopup"];

    function currentTeam() {
        var teamId = Session.get("currentTeam");
        if (!teamId) return null; //TODO choose current team (there must be one)

        var team = Teams.findOne(teamId);
        if (!team) return null;

        return team;
    }

    function updateTeamName(name) {
        var team = currentTeam();
        if (name.length && team && team.name !== name) {
            Meteor.call('updateName', team._id, name, function (error) {
                if (error) {
                    //TODO error handling
                    console.log(error);
                }
            });
        }
    }

///////////////////////////////////////////////////////////////////////////////
// UI

    Handlebars.registerHelper('isCurrentTeamSelected', function (id) {
        if (Session.get("currentTeam") === id)
            return "selected";
    });

    function setupInviteMember() {
        var inviteMemberPopup = $("#inviteMemberPopup");

        inviteMemberPopup.popup({theme: "a", overlayTheme: "a", dismissible: false});

        $("#openInviteMember").on("vclick", function () {
            inviteMemberPopup.find("input").val("");
            inviteMemberPopup.popup("open");
        });

        $("#inviteMember").on("click", function () {
            //TODO
            //clear input
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
    }

    function setupAddTeam() {
        var newTeamPopup = $("#newTeamPopup");
        newTeamPopup.popup({theme: "a", overlayTheme: "a", dismissible: false});
        $("#openNewTeamPopup").on("vclick", function () {
            newTeamPopup.find("input").val("");
            newTeamPopup.popup("open");
        });

        $("#addTeam").on("click", function () {
            var input = newTeamPopup.find("input");
            var teamName = input.val();

            Teams.insert({name: teamName, administrators: [Meteor.userId()]}, function (error, teamId) {
                if (!error) {
                    USERS.UpdateCurrentTeam(teamId);
                }
            });

            newTeamPopup.popup("close");
        });
    }

    function setupRenameTeam() {
        var renameTeamPopup = $("#renameTeamPopup");
        renameTeamPopup.popup({theme: "a", overlayTheme: "a", dismissible: false});
        $("#openRenameTeamPopup").on("vclick", function () {
            var input = renameTeamPopup.find("input");
            input.val(currentTeam().name);
            renameTeamPopup.popup("open");
        });
        $("#renameTeam").on("click", function () {
            var input = renameTeamPopup.find("input");
            var name = input.val();
            //TODO some validation
            updateTeamName(name);
            renameTeamPopup.popup("close");
            input.val("");
        });
    }

///////////////////////////////////////////////////////////////////////////////
// Template Functions

    Template.currentTeamSelect.teams = function () {
        return Teams.find().fetch();
    };

    Template.membersGrid.members = function () {
        var team = currentTeam();
        if (!team) return;

        var users = Meteor.users.find({_id: {$in: team.administrators}}).fetch();

        //TODO status (and role)
//role: "member",
//status: "Last Login: 11:42am"
        var members = _.map(users, function (user) {
            return {id: user._id, name: USERS.DisplayName(user), email: USERS.Email(user), role: "admin", status: "Invited"};
        });

        return members;
    };

    Template.membersGrid.statusIs = function (status) {
        return this.Status === status;
    };

    Template.teamSettingsView.currentTeamName = function () {
        var team = currentTeam();
        if (!team || !team.name) return "";

        return team.name;
    };

    Template.teamSettingsView.isTeamAdmin = function () {
        return Session.get("isTeamAdmin");
    };
    Template.teamSettingsView.isTeamMember = function () {
        return Session.get("isTeamMember");
    };

    Template.teamSettingsView.events = {
        'click #currentTeam': function (event) {
            var selectedTeam = $(event.currentTarget).find(':selected').val();
            USERS.UpdateCurrentTeam(selectedTeam);
        },
        'click #memberRole': function (event) {
            var select = $(event.currentTarget);

            var selectedRole = select.find(':selected').val();
            var member = select.data("id");

            //TODO
            console.log("member " + member + " change role to " + selectedRole);
        }
//    'keyup #teamName': function (event) {
//        var name = $(event.currentTarget).val();
//        updateTeamName(name);
//    }
    };

    Template.teamSettingsView.rendered = function () {
        TOOLS.RemovePopups(popups);

        $("#teamWrapper").trigger("create");

        setupInviteMember();
        setupAddTeam();
        setupRenameTeam();

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
        _.delay(function () {
            TOOLS.RemovePopups(popups);
        }, 250);
    };
}());