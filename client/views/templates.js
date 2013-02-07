// Copyright 2012 FoundOPS LLC. All Rights Reserved.

(function () {
    //runs the template with any hash parameters
    //if instantiated as a block helper, it will add the content as a property to hash
    Handlebars.registerHelper('template', function (options) {
        var hash = options.hash;

        if (_.isFunction(options)) //helper called as a block
            hash.content = options();

        var template = Template[hash.template](hash);
        return new Handlebars.SafeString(template);
    });

    Template.inputPopup.events = {
        //close popup on cancel button click
        'click .cancel': function (event) {
            var popup = $(event.currentTarget).parent(".ui-popup");
            popup.popup("close");
        }
    };
}());