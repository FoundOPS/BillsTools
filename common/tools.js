var ContainsRequiredFields = function (object, fields) {
    return _.every(fields, function (field) {
        return _.has(object, field);
    });
};