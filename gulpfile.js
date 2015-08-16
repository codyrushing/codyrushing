var gulp = require("gulp"),
    minifyCss = require("gulp-minify-css"),
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

gulp.task("bower", function(){
    return bower();
});

gulp.task("css", function(){
    return gulp.src(paths.src.scss + "/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(gulp.dest(paths.dist.css));
});

gulp.task("watch", function(){
    gulp.watch(paths.src.scss + "/**/*.scss", ["css"]);
});

gulp.task("default", ["css", "watch"]);
