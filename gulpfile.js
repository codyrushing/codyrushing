var gulp = require("gulp"),
    _ = require("lodash"),
    fs = require("fs"),
    spritesmith = require("gulp.spritesmith"),
    runSequence = require("run-sequence"),
    bower = require("gulp-bower"),
    base64 = require("gulp-base64"),
    lazypipe = require("lazypipe"),
    minifyCss = require("gulp-minify-css"),
    rename = require("gulp-rename"),
    filter = require("gulp-filter"),
    gulpSvgSymbols = require("gulp-svg-symbols"),
    sourcemaps = require("gulp-sourcemaps"),
    autoprefixer = require("gulp-autoprefixer"),
    nodemon = require("gulp-nodemon"),
    sass = require("gulp-sass");

var path = require("path");

var debug = false;

var srcBase = __dirname + "/public/src",
    distBase = __dirname + "/public/dist";

var paths = {
    src: {
        scss: srcBase + "/scss",
        img: srcBase + "/img",
        vector: srcBase + "/img/vector",
        views: __dirname + "/views"
    },
    dist: {
        css: distBase + "/css",
        img: distBase + "/img"
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

gulp.task("sprites", function(){
    return gulp.src(paths.src.vector + "/*.svg")
        .pipe(gulpSvgSymbols({
            templates: [paths.src.vector + "/symbols.hbs"]
        }))
        .pipe(gulp.dest(paths.src.views + "/partials"));
});

gulp.task("server", function(){
    var nodeCommand = debug ? "node --debug-brk --harmony" : "node --harmony";
    if(debug){
		require("child_process").spawn("node-inspector");
		require("child_process").spawn("open", ["http://localhost:8080/debug?port=5858"]);
    }
    return nodemon({
        script: "app.js",
        ext: "js hbs",
        ignore: ["public/*"],
        execMap: {
            js: nodeCommand
        }
    });
});

gulp.task("watch", function(){
    gulp.watch(paths.src.scss + "/**/*.scss", ["css"]);
});

gulp.task("default", ["bower", "css", "server", "watch"]);

gulp.task("debug", function(){
    debug = true;
    return runSequence("default");
});
