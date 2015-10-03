var koa = require("koa");
var app = koa();
var Post = require("./models/post");
var constants = require("./constants");
var router;

var path = require("path");
var fs = require("fs");

require("./settings")(app);
router = require("./routes")(app);

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

//Post.getAllPosts();

app.listen(3000);
