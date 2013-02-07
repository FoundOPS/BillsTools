// Copyright 2012 FoundOPS LLC. All Rights Reserved.

var ContainsRequiredFields = function (object, fields) {
    return _.every(fields, function (field) {
        return _.has(object, field);
    });
};