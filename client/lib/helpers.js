(function () {
    Handlebars.registerHelper('timeago', function (date) {
        if (date) {
            return $.timeago(date);
        }
        return '';
    });

    Handlebars.registerHelper('calendarTime', function (date) {
        if (date) {
            return moment(date).calendar();
        }
        return '';
    });
}());