Handlebars.registerHelper('timeago', function (date) {
    if (date) {
        return $.timeago(date);
    }
    return '';
});

Handlebars.registerHelper('convertUrls', function (text) {
    if (text) {
        var output = StringToURL(text);
        if(output){
            return new Handlebars.SafeString(output);
        }
        return text;
    }
    return '';
});


Handlebars.registerHelper('calendarTime', function (date) {
    if (date) {
        return moment(date).calendar();
    }
    return '';
});