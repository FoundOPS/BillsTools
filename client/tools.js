jQuery.fn.outerHTML = function () {
    return jQuery('<div />').append(this.eq(0).clone()).html();
};

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