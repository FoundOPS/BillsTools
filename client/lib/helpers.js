// Copyright 2012 FoundOPS LLC. All Rights Reserved.

(function () {
    Handlebars.registerHelper('timeago', function (date) {
        if (date) {
            return $.timeago(date);
        }
        return '';
    });

    Handlebars.registerHelper('convertUrls', function (text) {
        if (!text) return '';

        var match = TOOLS.StringToURL(text);
        var array = [];

        //No matches found in StringToURL. The default message is pushed into an object the urlTemplate can take.
        //TODO: Possibly make a defaultMessageTemplate.
        if (!match) {
            array.push({before: text});
            return Template.urlTemplate({array: array});
        }

        var i = 0;                                                    //Index for match iteration
        var offset = 0;                                             //Offset after each ending index of matches
        for (i in match) {
            var url = TOOLS.CreateLink(match[i]);                         //Url converted to html form
            var urlIndex = text.indexOf(match[i]);
            var before = text.substr(offset, urlIndex);
            if (offset == urlIndex) before = undefined;              //If nothing before, set to undefined
            var after = undefined;
            var last = (match.length - 1);
            if (i == last) {                                          //If last match, get text after url.
                var urlEnd = urlIndex + match[i].length - 1;
                after = text.substr(urlEnd + 1);
                if ((urlEnd + 1) >= text.length - 1)after = undefined;     //If nothing after, set to undefined
            }
            array.push({before: before, url: url, after: after});   //Pushes another template object
            offset = (urlIndex + match[i].length);
        }
        return Template.urlTemplate({array: array});                //Send array of template objects to template
    });

    Handlebars.registerHelper('calendarTime', function (date) {
        if (date) {
            return moment(date).calendar();
        }
        return '';
    });
}());