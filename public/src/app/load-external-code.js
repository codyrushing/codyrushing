var $ = require("domtastic"),
    request = require("qwest");

var repaint = require("app/repaint");

module.exports = function(el, i){
    var $el = $(el);
    request.get("/file-embed/", {
        fileUrl: $el.attr("data-src")
    }).then(function(xhr, response){
        $el.removeAttr("data-src").html(response.fileHtml);
        repaint($("main .page-navigation a"));
    });
}
