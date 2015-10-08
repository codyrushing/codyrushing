var hbs = require("koa-hbs"),
    hbsHelpers = require("./public/src/js/handlebars-helpers");

module.exports = function(app){

    // register helpers from client side helpers file, so we're all using the same helpers
    if(hbsHelpers){
        Object.keys(hbsHelpers).forEach(function(key, i){
            if(typeof hbsHelpers[key] === "function"){
                hbs.registerHelper(key, hbsHelpers[key]);
            }
        });
    }

    app.use(hbs.middleware({
        viewPath: __dirname + "/views",
        layoutsPath: __dirname + "/views/layouts",
        partialsPath: __dirname + "/views/partials",
        defaultLayout: "main"
    }));

    return app;
};
