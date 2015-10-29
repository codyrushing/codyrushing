var koa = require("koa"),
    Post = require("./models/post"),
    constants = require("./constants"),
    gzip = require("koa-gzip"),
    finalRequestHandler = require("./controller/final-request-handler");

var fs = require("fs");

var app = koa(),
    router;

var apodFetch = function(){
    require("./apod").call(app).then(function(apodData){
        console.log("found apod data");
    });
};

require("./settings")(app);
router = require("./controller/routes")(app);

// apod scrape background task
apodFetch();
setInterval(apodFetch, 1000 * 60 * 60);

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

// static
app.use(require("koa-static")("public", {
    maxage: 1000 * 60 * 60 * 2
}));

// response
app
    .use(router.routes())
    .use(finalRequestHandler)
    .use(router.allowedMethods());

// static
app.use(require("koa-static")(constants.STATIC_PATH, {
    maxage: 1000 * 60 * 60 * 10
}));

app.use(gzip());

app.listen(3000);
