var router = require("koa-router")(),
    finalRouteHandler = require("./final-route-handler");

module.exports = function(app){

    router
        .get("/", function *(next){
            Post.getAll(function(posts){
                this.posts = posts;
                // yield next;
            });
        }, finalRouteHandler)
        .get("/page/:page", function *(next){
            yield this.render("post");
        }, finalRouteHandler)
        .get("/tag/:tag/page/:page", function *(next){
            yield this.render("post");
        }, finalRouteHandler)
        .get("/search/:query/page/:page", function *(next){

        }, finalRouteHandler)
        .get("/:postid", function *(next){
            yield this.render("post");
        }, finalRouteHandler);

    return router;
};
