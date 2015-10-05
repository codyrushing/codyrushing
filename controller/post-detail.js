var Post = require("../models/post"),
    getPageTitle = require("./utils/get-page-title");

module.exports = function *(next){
    var ctx = this;
    yield new Promise(function(resolve, reject){
        Post.getById(ctx.params.postId).then(function(post){
            ctx.state.pageData = {
                pageTitle: getPageTitle({postTitle: post.getTitle()}),
                post: post.toFullJSON(),
                isSingle: true
            };
            resolve();
        }, reject);
    });
    yield next;
};
