var wd = require('wd'), assert = require('assert');

var browser = wd.remote();

browser.init(function () {
    browser.get("http://saucelabs.com/test/guinea-pig", function () {
        browser.title(function (err, title) {
            console.log(title);
            browser.elementById('submit', function (err, el) {
                browser.clickElement(el, function () {
                    browser.eval("window.location.href", function (err, href) {
                        assert.ok(~href.indexOf('guinea'), 'Wrong URL!');
                        browser.quit();
                    });
                });
            });
        });
    });
});