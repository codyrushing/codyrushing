var $ = require("domtastic"),
    dispatcher = require("./dispatcher"),
    request = require("qwest");

var App = function(){
    if(!(this instanceof App)){
        return new App();
    }
    this.init();
    return this;
};

App.prototype = {
    init: function(){
        this.fullHost = window.location.protocol + "//" + window.location.hostname;
        this.setup();
        this.bindEvents();
    },
    setup: function(){
        require("app/setup-templates").call(this);
        require("app/feature-detection").call(this);
    },
    bindEvents: function(){
        var self = this;
        var bindPopstate = function(){
            $(window).on("popstate", this.on_popstate.bind(this));
        }

        $(window)
            .on("DOMContentLoaded", this.on_DOMContentLoaded.bind(this));

        // bind popstate event after a delay because Safari likes to throw one immediately
        setTimeout(bindPopstate.bind(this), 100);

        $(document).on("click", "a[href^='/'], a[href^='"+this.fullHost+"']", function(e){
            self.onclick_internalLink.call(this, e, self);
        });

        // dispatcher Events
        dispatcher.on("ready", require("app/actions/post-render-main"));
        dispatcher.on("routeChange", require("app/actions/navigate"));
    },
    onclick_internalLink: function(e, app){
        var route;
        if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey){
            e.preventDefault();
            route = $(this).attr("href").replace(new RegExp("^"+app.fullHost), "");
            if (route !== window.location.pathname){
                dispatcher.emit("routeChange", route);
            }
        }
    },
    on_popstate: function(e){
        if(e.state){
            this.setState(e.state);
        } else {
            dispatcher.emit("routeChange", window.location.pathname);
        }
    },
    on_DOMContentLoaded: function(e){
        dispatcher.emit("ready", $("body"));
    },
    setState: function(state){
        this.state = state;
        require("app/actions/render")();
    }
};

module.exports = new App();
