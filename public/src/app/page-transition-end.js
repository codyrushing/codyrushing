var $ = require("domtastic"),
    dispatcher = require("app/dispatcher");

module.exports = function($incoming){
    var app = require("app/app");

    // $incoming may produce a list of nodes somehow, so just to be safe we look for the first
    $incoming = $incoming.eq(0)
        .on(app.animation.animationEndEvent, function(e){
            $(e.srcElement).removeClass("in");
            window.dispatchEvent(new Event('resize'));
        });

    if(app.supports.animation){
        $incoming.addClass("in");
    }

    $("body").removeClass("animating");
    $("main").replaceWith( $incoming );
    dispatcher.emit("ready", $incoming);

}
