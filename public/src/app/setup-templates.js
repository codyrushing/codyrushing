var Handlebars = require("handlebars/dist/handlebars.runtime.min");

module.exports = function(){
    // register helpers
    require("app/handlebars-helpers")(Handlebars);

    this.templates = {
        list: require("app/templates/list"),
        single: require("app/templates/single")
    };
};
