var _ = require("lodash"),
    fastmatter = require("fastmatter"),
    marked = require("marked"),
    concatStream = require("concat-stream"),
    fs = require("fs");

var constants = require("../constants");

marked.setOptions({
    smartypants: true
});

var Post = function(id){
    if(!this instanceof Post){
        return new Post(arguments);
    }

    this._data = {};
    this._id = id;

    return this;
};

// instance methods
Post.prototype = {
    isEmpty: function(){
        return _.isEmpty(this._data) && _.isEmpty(this._body);
    }
};

// static methods
Post.getById = function(postId, done){
    var postFilePath = constants.CONTENT_PATH + postId + ".md";

    // if markdown file exists
    fs.access(postFilePath, fs.R_OK, function(err){
        var post;
        if(err) done(err, null);

        post = new Post(postId);

        // parse front matter and raw markdown
        fs.createReadStream(postFilePath)
            .pipe(
                fastmatter.stream(function(attributes, body){
                    post._data = _.assign(post._data, attributes);
                    this.pipe(concatStream(function(body){
                        post._body = body.toString();
                    }));
                    this.on("end", function(){
                        done(null, post);
                    });

                })
            )


    });

};

module.exports = Post;
