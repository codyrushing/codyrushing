var $ = require("domtastic");

var pageTransitionEnd = require("app/page-transition-end");

module.exports = function(){
    var app = require("app/app");

    var $incoming = $(app.templates[app.state.template](app.state));
    pageTransitionEnd($incoming);
    $("body").removeClass("list single").addClass(app.state.template);
    if(app.state.pageTitle){
        document.title = app.state.pageTitle;
    }
    window.scrollTo(0,0);
}
