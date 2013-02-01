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
    var urlPattern = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;
    var match = str.match(urlPattern);
    if(!match)return;
    var startIndex = str.indexOf(match[0]);
    var endIndex = startIndex + match[0].length-1;
    //console.log(match[0]);
    //console.log("start: "+startIndex+" endIndex: "+endIndex);
    //console.log("string: "+str.substr(startIndex, endIndex-1));
    var beginning = str.substr(0, startIndex);
    //beginning = encodeURIComponent(beginning);
    console.log(beginning);
    var end = str.substr(endIndex+1);
    //end = encodeURIComponent(end);
    console.log(end);
    var url = str.replace(match[0], match[0].link(match[0]));
    console.log(url);
    return beginning+url+end;
};