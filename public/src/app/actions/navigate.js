var $ = require("domtastic"),
    request = require("qwest");

module.exports = function(route){
    var app = require("app/app");

    require("app/page-transition-start")();

    if(app.supports.history){
        request.get(route, {ajax: true}).then(function(xhr, response){
            app.setState(response);
            window.history.pushState(app.state, app.state.pageTitle, route);
            if(typeof ga === "function"){
                ga("send", "pageview", route);
            }
        });
    }

};
