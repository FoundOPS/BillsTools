Template.teamSettingsView.rendered = function () {
    $.mobile.changePage($("#teamWrapper"));

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

    //setup invite member popup
    $("#inviteMemberPopup").popup({
        //dismissible: false
    });
    $("#openInviteMember").on("vclick", function () {
        $("#inviteMemberPopup").popup("open");
    });
    $("#inviteMember").on("vclick", function () {
        //TODO
    });
    $("#closeInviteMember").on("vclick", function () {
        $("#inviteMemberPopup").popup("close");
    });
};

Template.teamSettingsView.destroyed = function () {
    //TODO
};

Template.membersGrid.statusIs = function (status) {
    return this.Status === status;
};

Template.membersGrid.members = [
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
];