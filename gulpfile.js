var gulp = require("gulp"),
    fs = require("fs"),
    bower = require("gulp-bower"),
    base64 = require("gulp-base64"),
    lazypipe = require("lazypipe"),
    minifyCss = require("gulp-minify-css"),
    rename = require("gulp-rename"),
    filter = require("gulp-filter"),
    sourcemaps = require("gulp-sourcemaps"),
    autoprefixer = require("gulp-autoprefixer"),
    nodemon = require("gulp-nodemon"),
    sass = require("gulp-sass");

var srcBase = __dirname + "/public/src",
    distBase = __dirname + "/public/dist";

var paths = {
    src: {
        scss: srcBase + "/scss"
    },
    dist: {
        css: distBase + "/css"
    },
    lib: __dirname + "/public/bower_components"
};

var copyFileStream = function(srcPath, destPath){
    var readStream = fs.createReadStream(srcPath),
		writeStream = fs.createWriteStream(destPath);

    return readStream.pipe(writeStream);
};

var cssMainChannel = lazypipe()
    .pipe(sourcemaps.init)
    .pipe(sass, {
        includePaths: [paths.lib]
    })
    .pipe(autoprefixer, {
        browsers: 'last 3 versions'
    })
    .pipe(sourcemaps.write)
    .pipe(gulp.dest, paths.dist.css)
    ();

var cssProdChannel = lazypipe()
    .pipe(filter, "**/*.css")
    // this is required to properly construct production css, otherwise throws a sourcemap error
    .pipe(sourcemaps.init)
    .pipe(base64, {
        baseDir: distBase,
        debug: false,
        extensions: ["svg", "png"]
    })
    .pipe(rename, {
        suffix: ".min"
    })
    .pipe(sourcemaps.write)
    .pipe(minifyCss)
    .pipe(gulp.dest, paths.dist.css)
    ();

gulp.task("bower-install", function(){
    return bower();
});

gulp.task("bower", ["bower-install"], function(){
    return copyFileStream(paths.lib + "/normalize.css/normalize.css", paths.lib + "/normalize.css/_normalize.scss");
});

gulp.task("css", function(){
    return gulp.src(paths.src.scss + "/*.scss")
        .pipe(cssMainChannel);
});

gulp.task("server", function(){
    return nodemon({
        script: "app.js",
        ext: "js",
        ignore: ["public/*"],
        execMap: {
            js: "node --harmony"
        }
    });
});

gulp.task("watch", function(){
    gulp.watch(paths.src.scss + "/**/*.scss", ["css"]);
});

gulp.task("default", ["bower", "css", "server", "watch"]);
