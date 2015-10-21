var hbs = require("koa-hbs");

module.exports = function(app){

    // register helpers from client side helpers file, so we're all using the same helpers
    require("./public/src/js/handlebars-helpers")(hbs);

    app.use(hbs.middleware({
        viewPath: __dirname + "/views",
        layoutsPath: __dirname + "/views/layouts",
        partialsPath: __dirname + "/views/partials",
        defaultLayout: "main"
    }));

    app.on("error", function(err, ctx){
        console.log(err);
    });

    // compress html
    if(app.env === "production"){
        app.use(require("koa-compress")());
        app.use(require("koa-html-minifier")({
            collapseWhitespace: true
        }));
    }

    return app;
};
