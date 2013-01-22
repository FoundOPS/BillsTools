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

function urlParameters() {
    var urlParams = {};
    (function () {
        var match,
            pl = /\+/g, // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) {
                return decodeURIComponent(s.replace(pl, " "));
            },
            query = window.location.search.substring(1);

        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);
    })();
    return urlParams;
}