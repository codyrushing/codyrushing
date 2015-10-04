var _ = require("lodash"),
    fastmatter = require("fastmatter"),
    marked = require("marked"),
    concatStream = require("concat-stream"),
    moment = require("moment");

var path = require("path"),
    fs = require("fs");

var constants = require("../constants");

marked.setOptions({
    smartypants: true
});

// CONSTRUCTOR
var Post = function(id){
    if(!this instanceof Post){
        return new Post(arguments);
    }

    this._data = {};
    this._id = id;

    return this;
};

// PROTOTYPE instance methods
Post.prototype = {
    getTags: function(){
        if(!this.isEmpty()){
            return this._data.tags;
        }
    },
    getBodyHtml: function(){
        return marked(this._body);
    },
    isEmpty: function(){
        return _.isEmpty(this._data) && _.isEmpty(this._body);
    },
    getRenderingModel: function(){

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

Post.getAllForSearchQuery = function(query, done){
    Post.getAll(function(err, posts){
        if(err){
            done(err);
        } else if(posts) {
            done(null, _.filter(posts, function(post){
                // query;
                // return post._data.tags && _.includes(post._data.tags, tag);
            }));
        }
    });
};

Post.getAllForTag = function(tag, done){
    Post.getAll(function(err, posts){
        if(err){
            done(err);
        } else if(posts) {
            done(null, _.filter(posts, function(post){
                return post._data.tags && _.includes(post._data.tags, tag);
            }));
        }
    });
};

Post.getAll = function(done){
    var self = this;
        posts = [];
    fs.readdir(constants.CONTENT_PATH, function(err, files){
        if(err) done(err, null);
        files.forEach(function(val, i){
            self.getById(path.parse(val).name, function(err, post){
                if(!err){
                    posts.push(post);
                }
                if(i === files.length-1){
                    done(null, posts);
                }
            });
        });
    });
};

Post.sortByDate = function(posts){
    return _.sortBy(posts, function(post){
        return moment(post._data.date, "DD/MM/YY").toDate();
    }).reverse();
}

module.exports = Post;
