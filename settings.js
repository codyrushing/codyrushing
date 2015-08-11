var hbs = require("koa-hbs")

module.exports = function(app){

    app.use(hbs.middleware({
        viewPath: __dirname + "/views",
        layoutsPath: __dirname + "/views/layouts",
        partialsPath: __dirname + "/views/partials",
        defaultLayout: "main"
    }));

    return app;
};
