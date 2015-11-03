var $ = require("domtastic"),
    dispatcher = require("app/dispatcher");

var repaint = require("app/repaint");

module.exports = function($incoming){
    var app = require("app/app");

    // $incoming may produce a list of nodes somehow, so just to be safe we look for the first
    $incoming = $incoming.eq(0)
        .on(app.animation.animationEndEvent, function(e){
            var $main = $(e.srcElement);
            $main.removeClass("in");
            repaint($main.find(".page-navigation a"));

        });

    if(app.supports.animation){
        $incoming.addClass("in");
    }

    $("body").removeClass("animating");
    $("main").replaceWith( $incoming );
    dispatcher.emit("ready", $incoming);

}
