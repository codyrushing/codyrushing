var gulp = require("gulp"),
    _ = require("lodash"),
    fs = require("fs"),
    source = require("vinyl-source-stream"),
    browserify = require("browserify"),
    buffer = require("vinyl-buffer"),
    spritesmith = require("gulp.spritesmith"),
    runSequence = require("run-sequence"),
    plumber = require("gulp-plumber"),
    wrap = require("gulp-wrap"),
    imagemin = require("gulp-imagemin"),
    bower = require("gulp-bower"),
    base64 = require("gulp-base64"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
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
        app: srcBase + "/app",
        views: __dirname + "/views"
    },
    dist: {
        css: distBase + "/css",
        img: distBase + "/img",
        fonts: distBase + "/fonts",
        js: distBase + "/js"
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



gulp.task("images", function(){
    gulp.src([paths.src.img + "/**/*.{jpg,png,gif}"])
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(gulp.dest(paths.dist.img));
});

gulp.task("copy", ["images"], function(){
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
        ext: "js hbs md",
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
        .pipe(handlebars())
        // .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(defineModule("node", {
                require: {
                    Handlebars: "handlebars/dist/handlebars.runtime.min"
                }
        }))
        .pipe(gulp.dest(paths.src.app + "/templates"));
});

gulp.task("hbs-partials", function(){
    return gulp.src([paths.src.views + "/partials/**/*.hbs"])
        .pipe(handlebars())
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
        .pipe(gulp.dest(paths.src.app + "/templates/partials/"))
        .pipe(defineModule("node", {
            require: {
                Handlebars: "handlebars"
            }
        }))
        .pipe(gulp.dest(paths.src.app + "/templates/partials/"));

});

gulp.task("js", function(){
    var b = browserify({
        entries: paths.src.app + "/app.js",
        debug: true
    });

    return b.bundle()
        .pipe(source("app.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .on("error", function(err){
            console.log(err.message);
            this.emit("end");
        })
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.dist.js))
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(paths.dist.js));
});

gulp.task("watchImages", function(){
    gulp.watch([paths.src.img + "/**/*.{jpg,png,gif}"], ["images"]);
});

gulp.task("watch", ["watchImages"], function(){
    gulp.watch([paths.src.scss + "/**/*.scss"], ["css"]);
    gulp.watch([paths.src.views + "/**/*.hbs"], ["templates"]);
    gulp.watch([paths.src.app + "/**/*.js"], ["js"]);
});

gulp.task("build", function(cb){
    return runSequence(["copy", "bower", "sprites"], ["templates", "css"], "js", cb);
});

gulp.task("default", function(cb){
    return runSequence("build", "server", "watch", cb);
});

gulp.task("debug", function(){
    debug = true;
    return runSequence("default");
});
