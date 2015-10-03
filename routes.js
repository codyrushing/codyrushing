var router = require("koa-router")();

module.exports = function(app){
    router
        .get("/", function *(next){
            yield this.render("home");
            yield next;
        })
        .get("/page/:page", function *(next){

        })
        .get("/tag/:tag/page/:page", function *(next){

        })
        .get("/search/:query/page/:page", function *(next){

        })
        .get("/:postid", function *(next){

        });

    return router;
};
