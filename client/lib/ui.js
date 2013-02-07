// Copyright 2012 FoundOPS LLC. All Rights Reserved.

var UI = (function () {
    var my = {};

    my.Green = "#7fbb00";
    my.Yellow = "#F12A06";

    Meteor.startup(function () {
        moment.calendar.sameDay = 'LT';
    });

    return my;
}());
