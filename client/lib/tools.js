var TOOLS = (function () {
    var my = {};

///////////////////////////////////////////////////////////////////////////////
// General

    /**
     * @return {string}
     */
    my.HexToRGB = function (Hex) {
        var Long = parseInt(Hex.replace(/^#/, ""), 16);
        var rgb = {
            R: (Long >>> 16) & 0xff,
            G: (Long >>> 8) & 0xff,
            B: Long & 0xff
        };

        return "rgb(" + rgb.R + ", " + rgb.G + ", " + rgb.B + ")";
    };

///////////////////////////////////////////////////////////////////////////////
// jQuery Tools

    jQuery.fn.outerHTML = function () {
        return jQuery('<div />').append(this.eq(0).clone()).html();
    };

//Remove remnant jQuery Mobile popups
//takes an array of element ids
    my.RemovePopups = function (popupElements) {
        var elementsToRemove = _.map(popupElements, function (id) {
            return "#" + id + "-popup, " + id + "-screen";
        });

        $(elementsToRemove.join(", ")).empty().remove();
    };

///////////////////////////////////////////////////////////////////////////////
// Mobile

    my.IsMobileDevice = function () {
        return platform.os.family === "Android" ||
            platform.product === "iPhone" || platform.product === "iPod" || platform.product === "iPad"
            || window.cordova; //phonegap apps
    };

    my.IsMobileSize = function () {
        var w = $(window).width();
        var h = $(window).height();
        var b = ((w < 540 && h < 960) || (h < 540 && w < 960));
        return b;
    };

//From http://stackoverflow.com/questions/8335834/how-can-i-hide-the-android-keyboard-using-javascript
// my.HideKeyboard = function(element) {
//    element.attr('readonly', 'readonly'); // Force keyboard to hide on input field.
//    element.attr('disabled', 'true'); // Force keyboard to hide on textarea field.
//    setTimeout(function() {
//        element.blur();  //actually close the keyboard
//        // Remove readonly attribute after keyboard is hidden.
//        element.removeAttr('readonly');
//        element.removeAttr('disabled');
//    }, 100);
//};

    return my;
}());
