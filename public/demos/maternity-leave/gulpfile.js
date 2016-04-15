const path = require("path")

const gulp = require("gulp")
const gulpPlugins = require("gulp-load-plugins")()
const runSequence = require("run-sequence")

var paths = {
  src: {
    app: path.join(__dirname, "src", "app")
  },
  dist: {
    js: path.join(__dirname, "dist", "js")
  }
}

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
  done()
})

gulp.task("preview", () => {
  require("child_process").exec("npm run preview")
  gulpPlugins.util.log(gulpPlugins.util.colors.bold.green("Local dev server running on port 8080"))
  return;
})

gulp.task("dev", (done) => {
  runSequence("js", "watch", "preview", done)
})
