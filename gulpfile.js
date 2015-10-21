var gulp = require("gulp"),
    _ = require("lodash"),
    fs = require("fs"),
    source = require("vinyl-source-stream"),
    spritesmith = require("gulp.spritesmith"),
    runSequence = require("run-sequence"),
    plumber = require("gulp-plumber"),
    wrap = require("gulp-wrap"),
    bower = require("gulp-bower"),
    base64 = require("gulp-base64"),
    concat = require("gulp-concat"),
    lazypipe = require("lazypipe"),
    minifyCss = require("gulp-minify-css"),
    rename = require("gulp-rename"),
    handlebars = require("gulp-handlebars"),
    defineModule = require("gulp-define-module"),
    filter = require("gulp-filter"),
    gulpSvgSymbols = require("gulp-svg-symbols"),
    sourcemaps = require("gulp-sourcemaps"),
    autoprefixer = require("gulp-autoprefixer"),
    nodemon = require("gulp-nodemon"),
    sass = require("gulp-sass");

var constants = require("./constants")
    hbs = handlebars({
        // use handlebars instance that is bundled with koa-hbs
        handlebars: require(constants.HBS_PATH)
    });

var path = require("path");

var debug = false;

var srcBase = __dirname + "/public/src",
    distBase = __dirname + "/public/dist";

var paths = {
    src: {
        scss: srcBase + "/scss",
        fonts: srcBase + "/fonts",
        img: srcBase + "/img",
        vector: srcBase + "/img/vector",
        js: srcBase + "/js",
        views: __dirname + "/views"
    },
    dist: {
        css: distBase + "/css",
        img: distBase + "/img",
        fonts: distBase + "/fonts"
    },
    lib: __dirname + "/public/bower_components"
};

var copyFileStream = function(srcPath, destPath){
    var readStream = fs.createReadStream(srcPath),
		writeStream = fs.createWriteStream(destPath);

    return readStream.pipe(writeStream);
};

// var cssMainChannel = lazypipe()
    // .pipe(plumber)
    // .pipe(sourcemaps.init)
    // .pipe(sass, {
    //     includePaths: [paths.lib]
    // })
    // .pipe(autoprefixer, {
    //     browsers: 'last 3 versions'
    // })
    // .pipe(sourcemaps.write)
    // .pipe(gulp.dest, paths.dist.css)
    // ();

var cssProdChannel = lazypipe()
    .pipe(filter, "**/*.css")
    // this is required to properly construct production css, otherwise throws a sourcemap error
    .pipe(sourcemaps.init)
    .pipe(base64, {
        baseDir: distBase,
        debug: true,
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

gulp.task("copyNormalizeSCSS", function(){
    return gulp.src(paths.lib + "/normalize.css/normalize.css")
        .pipe(rename({
            extname: ".scss",
            prefix: "_"
        }))
        .pipe(gulp.dest(paths.src.scss + "/generated"));
});

gulp.task("copyHighlightSCSS", function(){
    return gulp.src(__dirname + "/node_modules/highlight.js/styles/default.css")
        .pipe(rename({
            extname: ".scss",
            prefix: "_highlightjs-"
        }))
        .pipe(gulp.dest(paths.src.scss + "/generated"));

});

gulp.task("bower", function(cb){
    return runSequence("bower-install", ["copyNormalizeSCSS", "copyHighlightSCSS"], cb);
});

gulp.task("copy", function(){
    return gulp.src(paths.src.fonts + "/**/*")
        .pipe(gulp.dest(paths.dist.fonts));
});

gulp.task("css", function(cb){
    return gulp.src([paths.src.scss + "/main.scss"])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: [paths.lib]
        }))
        .pipe(autoprefixer({
            browsers: 'last 3 versions'
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.dist.css))
        // begin prod flow
        .pipe(filter("**/*.css"))
        .pipe(sourcemaps.init())
        .pipe(base64({
            // baseDir: paths.dist.css,
            debug: true,
            extensions: ["woff"],
            maxImageSize: 50*1024
        }))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(sourcemaps.write())
        .pipe(minifyCss())
        .pipe(gulp.dest(paths.dist.css));
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

gulp.task("templates", function(){
    return runSequence(["hbs-templates", "hbs-partials"]);
});

gulp.task("hbs-templates", function(){
    return gulp.src([paths.src.views + "/*.hbs"])
        .pipe(hbs)
        .pipe(defineModule("node", {
            require: {
                Handlebars: constants.HBS_PATH
            }
        }))
        .pipe(gulp.dest(paths.src.js + "/templates/"));
});

gulp.task("hbs-partials", function(){
    return gulp.src([paths.src.views + "/partials/**/*.hbs", "!symbols.hbs"])
        .pipe(hbs)
        .pipe(
            wrap("Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));", {}, {
                imports: {
                    processPartialName: function(fileName) {
                        return JSON.stringify(path.basename(fileName, '.js'));
                    }
                }
            })
        )
        .pipe(concat("all.js"))
        .pipe(wrap("function(){<%= contents %>}"))
        .pipe(gulp.dest(paths.src.js + "/templates/partials/"))
        .pipe(defineModule("node", {
            require: {
                Handlebars: constants.HBS_PATH
            }
        }))
        .pipe(gulp.dest(paths.src.js + "/templates/partials/"));

});

gulp.task("watch", function(){
    return gulp.watch([paths.src.scss + "/**/*.scss"], ["css"]);
});

gulp.task("default", function(cb){
    return runSequence(["copy", "bower"], "css", "server", "watch", cb);
});

gulp.task("debug", function(){
    debug = true;
    return runSequence("default");
});
