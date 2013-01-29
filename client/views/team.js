Template.teamView.rendered = function () {
    $(".addName").on("click", function () {
        console.log("add");var answer = confirm("Are you sure you want to delete the selected service?");
        if (answer) {
            console.log("delete");
        }
    });

    $("#leaveTeam").on("click", function () {
        var answer = confirm("Are you sure you want to leave this team?");
        if (answer) {
            console.log("leave");
        }
    });

    $("#deleteTeam").on("click", function () {
        var answer = confirm("Are you sure you want to delete this team?");
        if (answer) {
            console.log("delete");
        }
    });
};

Template.grid.statusIs = function (status) {
    return this.Status === status;
};

Template.grid.members = [
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