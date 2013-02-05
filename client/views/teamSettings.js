(function () {
    var popups = ["inviteMemberPopup", "newTeamPopup", "renameTeamPopup", "lastTeamAdminPopup", "lastTeamPopup"];

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

    function getAdmins(team){
        if (!team) return null;
        if (!team.administrators) return null;
        return team.administrators;
    }

///////////////////////////////////////////////////////////////////////////////
// UI

    Handlebars.registerHelper('isCurrentTeamSelected', function (id) {
        if (Session.get("currentTeam") === id)
            return "selected";
    });

    function setupInviteMember() {
        var inviteMemberPopup = $("#inviteMemberPopup");

        TOOLS.On("#openInviteMember", "vclick", function () {
            inviteMemberPopup.find("input").val("");
            inviteMemberPopup.popup("open");
        });

        TOOLS.On("#inviteMember", "click", function () {
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

        TOOLS.On("#memberEmailSuggestion span", "vclick", function () {
            inviteMemberPopup.find(".email").val($(this)[0].innerText);
            $("#memberEmailSuggestion").attr("style", "display:none");
        });
    }

    function setupAddTeam() {
        var newTeamPopup = $("#newTeamPopup");

        TOOLS.On("#openNewTeamPopup", "vclick", function () {
            newTeamPopup.find("input").val("");
            newTeamPopup.popup("open");
        });
        TOOLS.On("#addTeam", "click", function () {
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

        TOOLS.On("#openRenameTeamPopup", "vclick", function () {
            var input = renameTeamPopup.find("input");
            input.val(currentTeam().name);
            renameTeamPopup.popup("open");
        });
        TOOLS.On("#renameTeam", "click", function () {
            var input = renameTeamPopup.find("input");
            var name = input.val();
            //TODO some validation
            updateTeamName(name);
            renameTeamPopup.popup("close");
            input.val("");
        });
    }

    function setupLastTeamAdminCheck(){
        //TODO Support ok on enter press.
        var lastAdminPopup = $("#lastTeamAdminPopup");
        lastAdminPopup.popup({theme: "a", overlayTheme: "a", dismissible: true});
    }

    function setupLastTeamCheck(){
        var lastTeamPopup = $("#lastTeamPopup");
        lastTeamPopup.popup({theme: "a", overlayTheme: "a", dismissible: false});
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
            selectRole(event);
        },
        'keyup #memberRole': function (event) {
            //TODO Only on enter?
            selectRole(event);
        }
//    'keyup #teamName': function (event) {
//        var name = $(event.currentTarget).val();
//        updateTeamName(name);
//    }
    };

    function selectRole(event){
        var select = $(event.currentTarget);
        var selectedRole = select.find(':selected').val();
        var member = select.data("id");

        var selectedRoleText = select.find(':selected').text().toLowerCase();
        if((selectedRoleText !== "admin") && Session.get("isTeamAdmin") && lastTeamAdmin()){
            select.val(0);
            select.selectmenu("refresh");
            $("#lastTeamAdminPopup").popup("open");
        }

        //TODO: Change roles and remove from admin
        console.log("member " + member + " change role to " + selectedRole);
    }

    //Returns true if the user is an admin of less than 2 teams.
    function lastTeamAdmin(){
        var team = currentTeam();
        //No team in currentTeam
        if(!team) return false;

        var admins = getAdmins(team);
        //More than one admin
        if(admins.length > 1) return false;

        var userId = Meteor.user()._id;
        //Not in admin list
        if(!userId || $.inArray(userId, admins)<0) return false;

        //Only admin left
        return true;
    }

    //Returns true if the user is part of less than 2 teams.
    function lastTeam(){
        var teams = Teams.find().fetch();
        if(teams.length > 1) return false;
        return true;
    }

    Template.teamSettingsView.rendered = function () {
        TOOLS.RenderPage(this.firstNode.parentNode, popups);

        setupInviteMember();
        setupAddTeam();
        setupRenameTeam();
        setupLastTeamAdminCheck();
        setupLastTeamCheck();

        TOOLS.On("#leaveTeam", "vclick", function () {
            if(lastTeam()){
                $("#lastTeamPopup").popup("open");
            }else{
                var answer = confirm("Are you sure you want to leave this team?");
                if (answer) {
                    //TODO Hookup leaving
                    console.log("leave");
                }
            }
        });

        TOOLS.On("#deleteTeam", "vclick", function () {
            var answer = confirm("Are you sure you want to delete this team?");
            if (answer) {
                console.log("delete");
            }
        });

        $(".ui-popup").on("popupafteropen", function(){
            $(this).find(".acceptButton").focus();
        })
    };

    Template.teamSettingsView.destroyed = function () {
        TOOLS.DestroyPage(popups);
    };
}());