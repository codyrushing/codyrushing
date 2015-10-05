var _ = require("lodash"),
    si = require("search-index")(),
    Post = require("./models/post");

module.exports = function(){
    Post.getAll().then(function(posts){
        var dataset = _.map(posts, function(post){
            return post.getFULLJSON();
        });
        si.add(dataset, {}, function(err){
            if(err) console.log("error adding document to search index");
        });
    });
    return si;
};
