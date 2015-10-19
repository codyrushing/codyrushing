var Post = require("../models/post"),
    getPageTitle = require("./utils/get-page-title");

module.exports = function *(next){
    var ctx = this;
    yield new Promise(function(resolve, reject){
        Promise.all([Post.getById(ctx.params.postId), Post.getAll()]).then(function(promiseReturnValues){
            var post = promiseReturnValues[0];
            var allPostsSorted = Post.sortByDate(promiseReturnValues[1]);

            var newerPost = Post.getNewerPost(post, allPostsSorted);
            var olderPost = Post.getOlderPost(post, allPostsSorted);

            ctx.state.pageData = {
                pageTitle: getPageTitle({postTitle: post.getTitle()}),
                post: post.toFullJSON(),
                template: "single",
                newerPost: newerPost ? newerPost.toPreviewJSON() : null,
                olderPost: olderPost ? olderPost.toPreviewJSON() : null
            };
            resolve();
        }, reject);
    });
    yield next;
};
