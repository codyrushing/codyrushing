var _ = require("lodash"),
    fastmatter = require("fastmatter"),
    marked = require("marked"),
    concatStream = require("concat-stream"),
    moment = require("moment");

var path = require("path"),
    fs = require("fs");

var constants = require("../constants");

marked.setOptions({
    smartypants: true,
    highlight: function (code) {
        return require("highlight.js").highlightAuto(code).value;
    }
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
        if(!this.isEmpty()){
            return this._body;
        }
    },
    getId: function(){
        return this._id;
    },
    getTitle: function(){
        if(!this.isEmpty()){
            return this._data.title;
        }
    },
    getIntro: function(){
        if(!this.isEmpty()){
            return this._data.intro;
        }
    },
    getDateString: function(){
        if(!this.isEmpty()){
            return moment(this._data.date).format("LL");
        }
    },
    isEmpty: function(){
        return _.isEmpty(this._data) && _.isEmpty(this._body);
    },
    toJSON: function(){
        return {
            title: this.getTitle(),
            intro: this.getIntro(),
            id: this.getId(),
            date: this.getDateString(),
            tags: this.getTags()
        };
    },
    toPreviewJSON: function(){
        return {
            title: this.getTitle(),
            id: this.getId()
        };
    },
    toFullJSON: function(){
        return {
            title: this.getTitle(),
            intro: this.getIntro(),
            id: this.getId(),
            date: this.getDateString(),
            tags: this.getTags(),
            content: this.getBodyHtml()
        };
    }
};

// static methods
Post.getById = function(postId){
    return new Promise(function(resolve, reject){
        if(Post.cache.hasOwnProperty(postId)){
            resolve(Post.cache[postId]);
        }

        var postFilePath = constants.CONTENT_PATH + postId + ".md";
        // if markdown file exists
        fs.access(postFilePath, fs.R_OK, function(err){
            var post;
            if(err){
                reject(err);
                return;
            }

            post = new Post(postId);

            // parse front matter and raw markdown
            fs.createReadStream(postFilePath)
                .pipe(
                    fastmatter.stream(function(attributes, body){
                        // save yaml front matter data to _data key
                        post._data = _.assign(post._data, attributes);
                        if(post._data.date){
                            post._data.date = moment(post._data.date, "DD/MM/YY").toDate();
                        }
                        // the intro can be markdown, so parse it as markdown
                        if(post._data.intro){
                            post._data.intro = marked(post._data.intro);
                        }
                        this.pipe(concatStream(function(body){
                            post._body = marked(body.toString());
                        }));
                        this.on("end", function(){
                            Post.cache[postId] = post;
                            resolve(post);
                        });

                    })
                )
        });
    });

};

Post.getOlderPost = function(post, allPostsSorted){
    var currentPostIndex = _.indexOf(allPostsSorted, post);
    return currentPostIndex < allPostsSorted.length - 1 ? allPostsSorted[currentPostIndex+1] : null;
};

Post.getNewerPost = function(post, allPostsSorted){
    var currentPostIndex = _.indexOf(allPostsSorted, post);
    return currentPostIndex > 0 ? allPostsSorted[currentPostIndex-1] : null;
};

Post.getAll = function(){
    var self = this,
        posts = [];

    return new Promise(function(resolve, reject){
        fs.readdir(constants.CONTENT_PATH, function(err, files){
            var promises = [];
            if(err) reject(err);
            files.forEach(function(val, i){
                var singularPromise = self.getById(path.parse(val).name)
                    .then(function(post){
                        posts.push(post);
                    });

                promises.push(singularPromise);

            });
            Promise.all(promises)
                .then(function(){
                    resolve(posts)
                }, reject);
        });

    });
};


Post.getAllForSearchQuery = function(query, si){
  return new Promise(function(resolve, reject){
    si.search({
      "query": {"*": [query]}
    }, function(err, results){
      if(err){
        reject(err);
      } else {
        resolve(results);
      }
    })
  });
};

Post.getAllForTag = function(tag){
    return new Promise(function(resolve, reject){
        Post.getAll().then(function(posts){
            resolve(_.filter(posts, function(post){
                return post._data.tags && _.includes(post._data.tags, tag);
            }));
        }, reject);
    });
};

Post.sortByDate = function(posts){
    return _.sortBy(posts, function(post){
        return post._data.date;
    }).reverse();
}

Post.cache = {};

module.exports = Post;
