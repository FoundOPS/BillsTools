jQuery.fn.outerHTML = function () {
    return jQuery('<div />').append(this.eq(0).clone()).html();
};

//initializes jQuery mobile page manually
var SetupMobilePage = function (selector) {
    selector.page();
    selector.addClass("ui-page-active");
    $.mobile.document.trigger("pageshow");
};

var UrlParameters = function () {
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
};

var HexToRGB = function (Hex) {
    var Long = parseInt(Hex.replace(/^#/, ""), 16);
    var rgb = {
        R: (Long >>> 16) & 0xff,
        G: (Long >>> 8) & 0xff,
        B: Long & 0xff
    };

    return "rgb(" + rgb.R + ", " + rgb.G + ", " + rgb.B + ")";
};

var IsMobileDevice = function () {
    return platform.os.family === "Android" ||
        platform.product === "iPhone" || platform.product === "iPod" || platform.product === "iPad"
        || window.cordova; //phonegap apps
};

var IsMobileSize = function () {
    var w = $(window).width();
    var h = $(window).height();
    var b = ((w < 540 && h < 960) || (h < 540 && w < 960));
    return b;
};

//From http://stackoverflow.com/questions/8335834/how-can-i-hide-the-android-keyboard-using-javascript
//var HideKeyboard = function(element) {
//    element.attr('readonly', 'readonly'); // Force keyboard to hide on input field.
//    element.attr('disabled', 'true'); // Force keyboard to hide on textarea field.
//    setTimeout(function() {
//        element.blur();  //actually close the keyboard
//        // Remove readonly attribute after keyboard is hidden.
//        element.removeAttr('readonly');
//        element.removeAttr('disabled');
//    }, 100);
//};