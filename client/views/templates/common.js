Handlebars.registerHelper('inputPopup', function (options) {
    var hash = options.hash;

    //default input popup content
    var content = '<input type="text" placeholder="name"/>';
    if (_.isFunction(options)) //helper called as a block
        content = options();

    hash.content = content;

    var template = Template.inputPopup(hash);
    return new Handlebars.SafeString(template);
});