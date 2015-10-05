var _ = require("lodash"),
    router = require("koa-router")(),
    constants = require("../constants"),
    Post = require("../models/post"),
    postsAll = require("./posts-all"),
    postsTag = require("./posts-tag"),
    postsSearch = require("./posts-search"),
    postDetail = require("./post-detail");

module.exports = function(app){

    router
        .get("/", postsAll)
        .get("/page/:page", postsAll)
        .get("/tag/:tag/", postsTag)
        .get("/tag/:tag/page/:page", postsTag)
        .get("/search/:query", postsSearch)
        .get("/search/:query/page/:page", postsSearch)
        .get("/:postId", postDetail);

    return router;
};
