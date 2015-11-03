// add the repaint class to trigger an animation to reposition elements in safari
var $ = require("domtastic");

module.exports = function($elementList){
    var app = require("app/app");
    $elementList
        .addClass("repaint")
        .on(app.animation.animationEndEvent, function(e){
            $(e.srcElement).addClass("repaint-finished").removeClass("repaint")
            .on(app.animation.animationEndEvent, function(event){
                $(event.srcElement).removeClass("repaint repaint-finished");
            });
        });
}
