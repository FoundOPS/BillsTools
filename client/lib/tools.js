jQuery.fn.outerHTML = function () {
    return jQuery('<div />').append(this.eq(0).clone()).html();
};

var urlParameters = function () {
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

var isMobileDevice = function () {
    return platform.os.family === "Android" ||
        platform.product === "iPhone" || platform.product === "iPod" || platform.product === "iPad"
        || window.cordova; //phonegap apps
};

var hexToRGB = function (Hex) {
    var Long = parseInt(Hex.replace(/^#/, ""), 16);
    var rgb = {
        R: (Long >>> 16) & 0xff,
        G: (Long >>> 8) & 0xff,
        B: Long & 0xff
    };

    return "rgb(" + rgb.R + ", " + rgb.G + ", " + rgb.B + ")";
};