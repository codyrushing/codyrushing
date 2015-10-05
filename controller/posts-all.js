var _ = require("lodash"),
    getListPageData = require("./utils/get-list-page-data"),
    getPageTitle = require("./utils/get-page-title"),
    Post = require("../models/post");

module.exports = function *(next){
    var ctx = this,
        page = parseInt(this.params.page) || 1;

        yield new Promise(function(resolve, reject){
            Post.getAll().then(function(posts){
                posts = Post.sortByDate(posts);
                ctx.state.pageData = _.assign({pageTitle: getPageTitle({page: page})}, getListPageData(posts, page, ctx.request.path));
                resolve();
            }, reject);
        });
        yield next;
}
