var jsdom = require("jsdom"),
    lwip = require("lwip"),
    moment = require("moment"),
    _ = require("lodash"),
    request = require("request");

var path = require("path"),
    fs = require("fs"),
    http = require("http");

var constants = require("./constants");

var APOD_PATH = __dirname + "/public/src/img/apod";

module.exports = function(){
    var app = this;

    var isExpired = function(){
        return _.isEmpty(app.apodData) || new Date().getTime() - app.apodData.timestamp > 1000 * 60 * 60;
    };

    var pathExists = new Promise(function(resolve, reject){
        fs.access(APOD_PATH, fs.R_OK | fs.W_OK, function(err){
						if(!err) {
								resolve();
						} else {
								fs.mkdir(APOD_PATH, function(error){
										resolve();
								})
						}
        })
    });


    var scrapeDOM = new Promise(function(resolve, reject){
        var dateString = moment().format("DDMMYY");

        jsdom.env("http://apod.nasa.gov/apod/astropix.html", ["http://code.jquery.com/jquery.js"], function(err, window){
            if(err){
                reject(err);
            } else if(window){

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
                    if(!_.isEmpty(app.apodData) && r.title === app.apodData.title){
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
                        videoId = videoId.substring(0, videoId.indexOf("?"));
                        if(videoSrc.indexOf("youtube.com") > -1){
                            // youtube
                            r.imageSrc = "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg"
                            resolve(r);
                        } else if(videoSrc.indexOf("vimeo.com") > -1){
                            // vimeo
                            request("http://vimeo.com/api/v2/video/" + videoId + ".json", function(error, response, body){
                                var videoInfo = body;
                                if(typeof videoInfo === "string"){
                                    videoInfo = JSON.parse(videoInfo)[0];
                                }
                                r.title = videoInfo.title;
                                r.imageSrc = videoInfo.thumbnail_large;
                                resolve(r);
                            });
                        }
                    } else {
                        // no image or video... sad
                        reject();
                    }
                }

            }
        });

    });

    return new Promise(function(resolve, reject){

        if(!isExpired()){
            // use cached data
            resolve();
        } else {
            // fetch page server side and scrape
            return Promise.all([scrapeDOM, pathExists]).then(function(scrapeData){
                var imageData = scrapeData[0],
										useCache = scrapeData.length > 1 ? scrapeData[1] : null,
										ext = path.extname(imageData.imageSrc),
                    fullLocalPath = APOD_PATH + "/full" + ext,
                    thumbLocalPath = APOD_PATH + "/thumbnail" + ext;

                    // this is only set to true if we scrape the DOM again prematurely
                    // so we continue to use the cache
                    if(useCache){
                        app.apodData.timestamp = new Date().getTime();
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
                                        app.apodData = _.assign(imageData, {
                                            url: "http://apod.nasa.gov",
                                            thumbPath: "/" + path.relative(constants.STATIC_PATH, thumbLocalPath).replace(/^src\//, "dist/"),
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

};
