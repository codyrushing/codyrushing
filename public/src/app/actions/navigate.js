var $ = require("domtastic"),
    request = require("qwest");

module.exports = function(route){
    var app = require("app/app");

    require("app/page-transition-start")();

    if(app.supports.history){
        request.get(route).then(function(xhr, response){
            app.setState(response);
            window.history.pushState(response, response.pageTitle, route);
        });
    } else {
        window.location.href = route;
    }

};
