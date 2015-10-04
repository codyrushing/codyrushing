var koa = require("koa"),
    Post = require("./models/post"),
    constants = require("./constants");

var fs = require("fs");

var app = koa(),
    router;

require("./settings")(app);
router = require("./controller/routes")(app);

// x-response-time
app.use(function *(next){
    var start = new Date;
    yield next;
    var ms = new Date - start;
    this.set('X-Response-Time', ms + 'ms');
});

// logger
app.use(function *(next){
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s - %s', this.method, this.url, ms);
});

// response
app
    .use(router.routes())
    .use(router.allowedMethods());

Post.getAll(function(err, posts){
    if(!err){
        Post.sortByDate(posts).forEach(function(post, i){
            console.log(post.getTags());
        });
    }
});

app.listen(3000);
