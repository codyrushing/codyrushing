---
title: Emerging leaders in web tech Gulp, Browserify, Susy and others
date: 11/02/15
tags: [tools, gulp, browserify, susy, browsersync, ismorphic]
intro: Working in web dev, especially front-end, means that you're constantly watching the horizon for new tech.  The landscape is always in flux, but in the last year I feel like some true winners have emerged that most of us can get behind.
---

<p>Working in web dev, especially front-end, means that you're constantly watching the horizon for new tech.  The landscape is always in flux, but in the last year I feel like some true winners have emerged that most of us can get behind.</p>
<p>I'm not try to say that the "losers" here are horrible and should never be used again.  I'm sure there are some use cases for which they might actually make more sense.  For almost every scenario, though, I think there's an obvious better choice.</p>

<h2>For DIY build tools and workflow automation : Gulp > Grunt</h2>
<p><a href="http://gulpjs.com/">Gulp</a> had the advantage of coming after <a href="http://gruntjs.com/">Grunt</a> (which paved the way for JavaScript-based build tools), and basically improved upon it every way.</p>
<h3>Flexibility</h3>
<p>Grunt tasks lock you into this configuration object literal.  Say you want to run a little bit of logic or set some higher-scoped variable in your task, that's frustratingly difficult in Grunt.  With Gulp, all tasks are just functions, so you can do whatever you want.  Consider this server task which starts up my development environment:</p>
<pre>
<code class="language-javascript">
var debugArgs = process.argv.filter(function(arg){
	return arg.indexOf("--") === 0;
});

gulp.task("server", function(){
	var r;

	// start up mongo when the server task is started
	require("child_process").exec("mongod --noauth");

	// start server via nodemon
	r = nodemon({
		script: "app.js",
		ext: "js",
		nodeArgs: debugArgs,
		ignore: ["public/", "gulpfile.js"]
	});

	// assume that if any command-line arguments are passed in, we will want to start node-inspector
	if(debugArgs.length){
		require("child_process").spawn("node-inspector");
		require("child_process").spawn("open", ["http://localhost:8080/debug?port=5858"]);
	}

	// launch our dev app in the browser
	require("child_process").spawn("open", ["http://localhost:3003/"]);

	return r;

});
</code>
</pre>
<p>So with this, I have a quick and dirty way to ensure my database is running when I start my application server.  I'm also starting up the debugger if command line arguments are present.  Pretty simple, but doing this in Grunt would be much less straightforward.</p>
<h3>Performance</h3>
<p>Gulp uses streams, so yeah &ndash; it's pretty much always faster.  This is also what makes Gulp a little confusing if you're coming from Grunt.  Most everything in Gulp is asynchronous, so it's not always as simple as queueing up your tasks in the order you want them to take place.  Gulp will run them all in parallel, which is a problem if you need task A to complete before task B begins.  If you're struggling with chaining your tasks together, I suggest you read and understand <a href="https://github.com/gulpjs/gulp/blob/master/docs/API.md#async-task-support">the async section of the Gulp docs</a>, which cleared it up for me.  Also, the <a href="https://github.com/OverZealous/run-sequence">run-sequence plugin</a> makes it easy to group tasks that can run in parallel and force certain tasks to run in sequence (and apparently something similar will be built-in to future versions of Gulp, which is cool).</p>

<h2>Client-side dependency management : Browserify > Require.js</h2>
<p>This is one that I could see people fighting me on.  <a href="http://requirejs.org/">Require.js</a> is still widely used, but once you try <a href="http://browserify.org/">Browserify</a>, you'll be wondering why Require.js needs to be so complicated.<p>
<h3>CommonJS is far easier to use than AMD</h3>
<p>Maybe I'm just a dummy, but I always struggled with AMD.  Using <code class="language-javascript">define()</code> was always tricky and confining, and you have to declare your dependency arguments in the exactly right order for it to work.  CommonJS is dead simple to understand: use <code class="language-javascript">module.exports</code> to export something as a dependency, and elsewhere use <code class="language-javascript">require()</code> to import it.  That's basically it.  It works just like Node; it builds a dependency tree for you, so that anything that has already been required will not need to be fetched again on subsequent requires.</p>

<h3>Bundling is (usually) better than asynchronous loading</h3>
<p>Out of the box, Require.js will load each dependency as a separate asynchronous request.  I get what they're going for, but I don't want the overhead of dozens of HTTP requests to start my application.  Yes, there is an <a href="http://requirejs.org/docs/optimization.html">optimization tool</a> to help consolidate resources, but that's just another layer of complexity.  Browserify takes all your modules and bundles that into a single resource.  Just uglify and gzip that, and that should be perfectly sufficient for 95% of web sites and applications.</p>
<p>Now say you have a large library or something that isn't essential to the core of your application, and you want to asynchronously load that at a later time &ndash; how will you do that if it's bundled in?  It's pretty simple really; you just make separate bundle for the less essential stuff, and then load that via any script loader.  It's important to note that if that separately-bundled package is <code class="language-javascript">require()</code>d anywhere in your application code, it will get bundled into the main application script.  So you have to explicitly remove it from your main dependency tree.  <a href="http://esa-matti.suuronen.org/blog/2013/04/15/asynchronous-module-loading-with-browserify/#lazy-loading-rarely-used-parts">Here's a more detailed write-up with code examples</a> of how to do this.</p>

<h3>Better isomorphic support</h3>
<p>It seems that we are really trying to move towards being able to share code between the client and server.  Makes sense, and since Browserify was modeled to exactly mimic Node, it's the obvious choice if isomorphic code is something you want.</p>

<h2>CSS micro libraries > Compass</h2>
<p><a href="http://compass-style.org/">Compass</a> used to be my go-to CSS framework for everything.  Now with Gulp making it so easy to employ several different smaller tools into your CSS workflow, I have no use for a monolithic framework like Compass or others.  Here are some of the better ones:</p>

<ul>
<li><a href="http://susy.oddbird.net/">Susy</a> &ndash; if you want some helpers for building a responsive grid, there are several options.  Foundation and Bootstrap are both out there, but those are full-blown frameworks, and they require you to use their markup structure and naming conventions.  All I want is a modular library of Sass helpers, and that's exactly what Susy is.  You configure your grid settings at the beginning of your Sass file, and from there it provides several mixins to help build your layouts.  Slightly more of a learning curve than Bootstrap, but it's well worth it.</li>
<li><a href="https://github.com/Ensighten/spritesmith">Spritesmith</a> &ndash; Compass' sprite generator was one feature that kept me coming back to it for the longest time, but spritesmith is actually even more powerful and easily integrates with Gulp.</li>
<li><a href="https://github.com/sindresorhus/gulp-autoprefixer">Autoprefixer</a> &ndash; Compass dealt with vendor prefixing by providing a host of mixins that you could use that would compile down to all the different prefixes.  Autoprefixer instead post processes your CSS, so you just write standards-compliant CSS and it will take care of all the prefixing - a much better approach I'd say.</li>
<li><a href="https://github.com/Wenqer/gulp-base64">gulp-base64</a> &ndash; this one's neat, it will post process your CSS and look for any url() declarations and replaces them with the base64 encoded data URIs.  Very elegant and a nice performance gain.</li>
</ul>

<h2>Bonus round: BrowserSync > LiveReload</h2>
<p>Truth be told, I was never a big fan of <a href="http://livereload.com/">LiveReload</a>.  I like to update markup and styles on the fly in the browser, and often LiveReload would needlessly refresh over those changes.  <a href="http://www.browsersync.io/">BrowserSync</a> has a clever solution to that problem.  It actually starts a websocket server that injects updated CSS into the page <em>without</em> a refresh.  You can also open multiple browsers and it will sync (duh) scrolling and other events across them all &ndash; great for browser testing and responsive debugging.  I haven't tried LiveReload in awhile, so there's a chance that they've added similar features.</p>

<p class="divider"></p>

<p>Perhaps in six months all of these tools will be rendered obsolete by the latest and greatest hotness, and I'll reread this post and facepalm at the fact that I used to think Gulp and Browserify would last.  That's only somewhat of a joke &ndash; web technology changes at a breakneck pace.  For now, though, I feel pretty good about these.<p>
