var getListPageData = require("./utils/get-list-page-data"),
    _ = require("lodash"),
    Post = require("../models/post");

module.exports = function *(next){
    var ctx = this,
        page = parseInt(this.params.page) || 1;

        yield new Promise(function(resolve, reject){
            Post.getAllForTag(ctx.params.tag).then(function(posts){
                posts = Post.sortByDate(posts);
                ctx.state.pageData = _.assign({
                    tag: ctx.params.tag,
                    isTagPage: true
                }, getListPageData(posts, page, ctx.request.path));
                resolve();
            }, reject);
        });
        yield next;
}
