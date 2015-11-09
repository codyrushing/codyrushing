var koa = require("koa"),
    Post = require("./models/post"),
    constants = require("./constants"),
    finalRequestHandler = require("./controller/final-request-handler");

var fs = require("fs");

var app = koa(),
    router;

var apodFetch = function(){
    require("./apod").call(app).then(function(apodData){
        // found apod data here
    });
};

require("./settings")(app);
router = require("./controller/routes")(app);

// force www
app.use(function *(next){
    if(this.hostname !== "localhost" && !this.hostname.startsWith("www.")){
        this.status = 301;
        this.redirect(constants.FULL_HOST + this.path);
        this.body = "Redirecting to www";
    } else {
        yield next;
    }
});

// x-response-time
app.use(function *(next){
    var start = new Date;
    yield next;
    var ms = new Date - start;
    this.set('X-Response-Time', ms + 'ms');
});

// fresh middleware
app.use(require("koa-fresh")())

// etag
app.use(require("koa-etag")());

// static
app.use(require("koa-static")("public", {
    maxage: 1000 * 60 * 60 * 24
}));

// response
app
    .use(router.routes())
    .use(finalRequestHandler)
    .use(router.allowedMethods());

app.listen(3000);

// apod scrape background task
apodFetch();
setInterval(apodFetch, 1000 * 60 * 60);
