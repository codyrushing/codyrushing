var getListPageData = require("./utils/get-list-page-data"),
    Post = require("../models/post"),
    si = require("../search");

module.exports = function *(next){
    var ctx = this,
        page = parseInt(this.params.page) || 1;

        yield new Promise(function(resolve, reject){
          console.log(si)
          si.then(function(searchIndex){
            console.log(searchIndex)
            Post.getAllForSearchQuery(ctx.params.query, searchIndex).then(function(posts){
                console.log("logging search results");
                console.log(posts);
                // posts = Post.sortByDate(posts);
                ctx.state.pageData = {};
                resolve();
            }, reject);
          })
        });
        yield next;
}
