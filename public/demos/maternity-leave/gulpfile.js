const path = require("path")

const gulp = require("gulp")
const gulpPlugins = require("gulp-load-plugins")()
const runSequence = require("run-sequence")

var paths = {
  src: {
    app: path.join(__dirname, "src", "app"),
    styles: path.join(__dirname, "src", "styles")
  },
  dist: {
    js: path.join(__dirname, "dist", "js"),
    css: path.join(__dirname, "dist", "css")
  },
  lib: path.join(__dirname, "node_modules")
}

gulp.task("copyNormalizeSCSS", function(){
  return gulp.src( path.join(paths.lib, "normalize.css", "normalize.css") )
    .pipe(gulpPlugins.rename({
        extname: ".scss",
        prefix: "_"
    }))
    .pipe( gulp.dest(path.join(paths.src.styles, "lib")) );
});

gulp.task("css", ["copyNormalizeSCSS"], (done) => {
  runSequence("buildCss", done)
})

gulp.task("buildCss", () => {



  return gulp.src( [path.join(paths.src.styles, "*.scss"), "!" + path.join(paths.src.styles, "_*.scss")] )
    .pipe(gulpPlugins.plumber({
      errorHandler: function(error){
        gulpPlugins.util.log(
    			gulpPlugins.util.colors.cyan('Plumber') + gulpPlugins.util.colors.red(' found unhandled error:\n'),
    			error.toString()
    		)
        this.emit("close")
        this.emit("end")
      }
    }))
    .pipe(gulpPlugins.sourcemaps.init())
    .pipe(gulpPlugins.sass({
      includePaths: [paths.lib]
    }))
    .pipe(gulpPlugins.autoprefixer({
      browsers: 'last 3 versions'
    }))
    .pipe(gulpPlugins.cleanCss())
    .pipe(gulpPlugins.rename({
      suffix: ".min"
    }))
    .pipe(gulpPlugins.sourcemaps.write())
    .pipe(gulp.dest(paths.dist.css))
    .pipe(gulpPlugins.notify("css built :)"))
})

gulp.task("eslint", () => {
  return gulp.src( path.join(paths.src.app, "**/*.js") )
    .pipe(gulpPlugins.newer( path.join(paths.dist.js, "app.js") ))
  	.pipe(gulpPlugins.eslint())
  	.pipe(gulpPlugins.eslint.format())
  	.pipe(gulpPlugins.eslint.failOnError())
})

gulp.task("js", ["eslint"], () => {
  const browserify = require("browserify")
  const source = require("vinyl-source-stream")

  var b = browserify(
    path.join(paths.src.app, "main.js"), // entry point
    {
      debug: true // write sourcemaps
    }
  ).transform("babelify")

  return b.bundle()
    .pipe(source("app.js"))
    .pipe(gulp.dest(paths.dist.js))
    .pipe(gulpPlugins.notify("app.js built :)"))
})

gulp.task("watch", (done) => {
  gulpPlugins.watch(path.join(paths.src.app, "**/*.js"), () => {
    runSequence("js")
  })
  gulpPlugins.watch(path.join(paths.src.styles, "**/*.scss"), () => {
    runSequence("buildCss")
  })
  done()
})

gulp.task("preview", () => {
  require("child_process").exec("npm run preview")
  gulpPlugins.util.log(gulpPlugins.util.colors.bold.green("Local dev server running on port 8080"))
  return;
})

gulp.task("dev", (done) => {
  runSequence(["js", "css"], "watch", "preview", done)
})
