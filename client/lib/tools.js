jQuery.fn.outerHTML = function () {
    return jQuery('<div />').append(this.eq(0).clone()).html();
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

var StringToURL = function(str) {
    //NOTE: From http://someweblog.com/url-regular-expression-javascript-link-shortener/
    //Matches urls.
    var urlPattern = /\(?\b(?:(http|https|ftp):\/\/)?((?:www.)?[a-zA-Z0-9\-\.]+[\.][a-zA-Z]{2,4})(?::(\d*))?(?=[\s\/,\.\)])([\/]{1}[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]\(\)]*))?([\#][^\s\n]*)?\)?/gi;

    var matches = str.match(urlPattern);
    var i=0;
    for(i in matches){
        //Removes starting and trailing parenthesis if found.
        if ( matches[i].charAt(0) == '(' && matches[i].charAt( matches[i].length-1 ) == ')' ) {
            matches[i] = matches[i].slice(1,-1);
        }
    }

    return matches;
};

//NOTE: From http://someweblog.com/url-regular-expression-javascript-link-shortener/
var ShortenUrl = function(url, options) {
    // set url length limit
    var limit = 30;
    var removeDomain = true;

    //Valid options:
    /*  var options = {
            limit: 20,
            removeDomain: true
        };
    */

    if(options){
        if(options.removeDomain) removeDomain = true;
        if(typeof(options.limit) !== "undefined") limit = options.limit;
    }

    //Remove domain if true.
    //if(removeDomain)url = url.replace('/www\./gi', '');

    // shorten URL if bigger than limit
    if (url.length > limit) {
        url = url.slice(0, url.length + (limit - url.length)) + '...';
    }
    return url;
};

var CreateLink = function (url) {
    //TODO: Possibly just make a string.
    var a = document.createElement('a');
    var urlHref = url;
    if (url.substr(0, 7) !== "http://" && url.substr(0, 8) !== "https://") {
        urlHref = "http://" + url;
    }
    a.href = urlHref;
    a.target = "_blank";
    var shortUrl = ShortenUrl(url);
    console.log(shortUrl);
    a.innerHTML = shortUrl;

    return $(a).outerHTML();
};

var OpenUrl = function (url) {
    if (url.substr(0, 7) !== "http://" && url.substr(0, 8) !== "https://") {
        url = "http://" + url;
    }

    if (generalTools.checkPlatform.isAndroid() && generalTools.checkPlatform.isCordova()) {
        window.plugins.childBrowser.showWebPage(url);
    } else {
        window.open(url, "_blank");
    }
};