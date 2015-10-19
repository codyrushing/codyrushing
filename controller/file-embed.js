var request = require("request"),
    highlight = require("highlight.js");

module.exports = function *(next){
    var ctx = this;
    if(ctx.query && ctx.query.fileUrl){
        yield new Promise(function(resolve, reject){
            request(ctx.query.fileUrl, function(err, res, body){
                if(err){
                    reject(err);
                } else {
                    ctx.response.body = {
                        fileHtml: highlight.highlightAuto(body).value
                    };
                    resolve();
                }
            });
        });
    }
};
