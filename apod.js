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

    var isExpired = function(){
        return _.isEmpty(ctx.app.apodData) || new Date().getTime() - ctx.app.apodData.timestamp > 1000 * 60 * 60;
    };

    var scrapeDOM = new Promise(function(resolve, reject){
        var dateString = moment().format("DDMMYY");

        jsdom.env("http://apod.nasa.gov/apod/astropix.html", ["http://code.jquery.com/jquery.js"], function(err, window){
            if(err) reject(err);
            var img = window.$("center:first img[src^='image/']").eq(0),
                titleBlock = window.$("center").eq(1),
                r = {
                    date: dateString,
                    title: "",
                    imageSrc: ""
                },
                videoIframe, videoSrc, videoId;

            if(titleBlock){
                r.title = titleBlock.find("b:first-child").text();
                // whoops, we rescraped the page prematurely
                // go ahead and resolve with useCache set to true
                if(!_.isEmpty(ctx.app.apodData) && r.title === ctx.app.apodData.title){
                    resolve(null, true);
                }
            }

            if(img.length){
                // we found a matching image
                r.imageSrc = img.attr("src");
                r.imageSrc = r.imageSrc.indexOf("http") === 0 ? r.imageSrc : "http://apod.nasa.gov/apod/" + r.imageSrc;
                resolve(r);
            } else {
                // try to find an iframe if there's no image
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
                } else {
                    // no image or video... sad
                    reject();
                }
            }
        });

    });

    yield new Promise(function(resolve, reject){

        if(!isExpired()){
            // use cached data
            resolve();
        } else {
            // fetch page server side and scrape
            scrapeDOM.then(function(imageData, useCache){
                var ext = path.extname(imageData.imageSrc),
                    fullLocalPath = APOD_PATH + "/full" + ext,
                    thumbLocalPath = APOD_PATH + "/thumbnail" + ext;

                    // this is only set to true if we scrape the DOM again prematurely
                    // so we continue to use the cache
                    if(useCache){
                        resolve();
                    }

                    // get the remote image from apod
                    // save out a fullsize onto disk, from which we can generate a thumb
                    request(imageData.imageSrc)
                        .pipe(fs.createWriteStream(fullLocalPath))
                        .on("finish", function(){
                            lwip.open(fullLocalPath, function(imgOpenErr, image){
                                if(imgOpenErr) reject(imgOpenErr);
                                image.cover(300, 300, function(imgResizeErr, resizeImage){
                                    resizeImage.writeFile(thumbLocalPath, function(imgSaveError, savedThumbnailImage){
                                        // thumb
                                        ctx.app.apodData = _.assign(imageData, {
                                            url: "http://apod.nasa.gov",
                                            thumbPath: "/" + path.relative(constants.STATIC_PATH, thumbLocalPath),
                                            timestamp: new Date().getTime()
                                        });
                                        resolve();
                                    });

                                })
                            });
                        });
            });
        }

    });

    yield next;

};
