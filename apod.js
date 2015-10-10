var jsdom = require("jsdom"),
    lwip = require("lwip"),
    moment = require("moment"),
    _ = require("lodash"),
    request = require("request");

var path = require("path"),
    fs = require("fs"),
    http = require("http");

var constants = require("./constants");

var APOD_PATH = __dirname + "/public/img/apod";

module.exports = function *(next){
    var ctx = this;

    console.log(this);

    var scrapeDOM = new Promise(function(resolve, reject){
        try {
            jsdom.env("http://apod.nasa.gov/apod/astropix.html", ["http://code.jquery.com/jquery.js"], function(err, window){
                if(err) reject(err);
                var img = window.$("center:first img[src^='image/']").eq(0),
                    titleBlock = window.$("center").eq(1),
                    r = {
                        date: moment().format("DDMMYY"),
                        title: "",
                        imageSrc: ""
                    },
                    videoIframe, videoSrc, videoId;

                if(titleBlock){
                    r.title = titleBlock.find("b:first-child").text();
                }

                if(img.length){
                    // we found a matching image
                    r.imageSrc = img.attr("src");
                    r.imageSrc = r.imageSrc.indexOf("http") === 0 ? r.imageSrc : "http://apod.nasa.gov/apod/" + r.imageSrc;
                    resolve(r);
                } else {
                    // try to find an iframe if there's no video
                    videoIframe = window.$("center:first iframe[src]").eq(0);
                    if(videoIframe.length){
                        videoSrc = videoIframe.attr("src");
                        videoId = path.basename(videoSrc);
                        if(videoSrc.indexOf("youtube.com") > -1){
                            // youtube
                            r.imageSrc = "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg"
                            resolve(r);
                        } else if(videoSrc.indexOf("vimeo.com") > -1){
                            // vimeo
                            request("http://vimeo.com/api/v2/video/" + videoId + ".json", function(error, response, body){
                                var videoInfo = JSON.parse(body)[0];
                                r.title = videoInfo.title;
                                r.imageSrc = videoInfo.thumbnail_medium;
                                resolve(r);
                            });
                        }
                    }
                }
            });
        } catch(e){
            console.log(e);
        }

    });

    yield new Promise(function(resolve, reject){
        scrapeDOM.then(function(imageData){
            var ext = path.extname(imageData.imageSrc),
                fullLocalPath = APOD_PATH + "/full" + ext,
                thumbLocalPath = APOD_PATH + "/thumbnail" + ext;

                request(imageData.imageSrc)
                    .pipe(fs.createWriteStream(fullLocalPath))
                    .on("finish", function(){
                        lwip.open(fullLocalPath, function(imgOpenErr, image){
                            if(imgOpenErr) reject(imgOpenErr);
                            image.cover(300, 300, function(imgResizeErr, resizeImage){
                                resizeImage.writeFile(thumbLocalPath, function(imgSaveError, savedThumbnailImage){
                                    ctx.state.pageData = ctx.state.pageData || {};
                                    ctx.state.pageData.apod = _.assign(imageData, {
                                        url: "http://apod.nasa.gov",
                                        thumbPath: "/" + path.relative(constants.STATIC_PATH, thumbLocalPath)
                                    });
                                    resolve();
                                });

                            })
                        });
                    });

        });
    });

    yield next;

};
