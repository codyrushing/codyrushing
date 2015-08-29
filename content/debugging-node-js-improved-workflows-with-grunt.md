<!-- 6/2/14 -->
<p>As I've been diving back into Node.js, it became apparent pretty quickly that I needed better debugging tools.  Here are some that I like so far and have integrated into my workflow with the help of Grunt.</p><!--more-->

<h2>Quick overview on debugging in Node</h2>

<p>Node has a <a href="http://nodejs.org/api/debugger.html">built-in debugger</a> that you can use by adding the <code class="language-bash">--debug</code> argument to your node command.  This will start an instance of the debugger that runs alongside your app (on port 5858 by default).  But, that by itself doesn't get you much.  To create a breakpoint, you have to add a line that reads <code class="language-javascript">debugger;</code> in your code, which I'm not too crazy about.  Also, you're still basically debugging in the command line, which for me is kinda cumbersome.</p>

<h2><a href="https://github.com/node-inspector/node-inspector">node-inspector</a></h2>

<p>node-inspector provides a browser-based debugging suite that looks and feels just like Chrome's native client-side dev tools.  This means you can set and remove breakpoints easily, evaluate expressions on hover, live edit your code, and basically anything else you can do in Chrome's dev tools, but for your server-side code.  Not having to learn another IDE or debugging tool is a big win &ndash; it's pretty ideal if you're coming from the world of client-side development.  node-inspector uses websockets, so it's all realtimey which is nice (although it can get slow when it bogs down).</p>

<p>node-inspector attaches itself to a node debugging instance, so you will need to start your app with <code class="language-bash">node --debug myApp.js</code> before running <code class="language-bash">node-inspector</code> which launches the inspector on port 8080 by default.  Once it's running, just go to <code class="language-bash">http://localhost:8080/debug?port=5858</code> to start debugging.  Or, you can use the bundled <code class="language-bash">node-debug myApp.js</code> command that will do everything as well as launch the debugging web app automatically.</p>

<h2>Using <code class="language-bash">--debug-brk</code></h2>

<p>If you're trying to debug some code at runtime, you'll probably find you don't have time to open node-inspector and apply a breakpoint before it finishes executing.  To remedy this, Node's debugger can apply a breakpoint on the first executable line if you instantiate it with the <code class="language-bash">--debug-brk</code> argument.  This allows you open up the inspector and set up any breakpoints or whatever else you need before your app runs.</p>

<p>If you're debugging things at server startup time, this will be indispensable.  Say you're only debugging something that happens at request time or some other delayed event, then you may not want to run it with <code class="language-bash">--debug-brk</code> since it will require you to go to node-inspector and advance the first breakpoint before your app can initialize.</p>

<h2><a href="https://github.com/remy/nodemon">nodemon</a></h2>

<p>If you work with node, you probably know about <code class="language-bash">nodemon</code>, which is a utility that watches your server files and will restart node when you make changes, saving you a lot of trips to the command line.  I want to be able to use nodemon with node-inspector so that I can instantly (more or less) debug my code as I'm making changes.</p>

<h2>Grunt integration</h2>

<p>Setting up nodemon in Grunt is simple with <a href="https://github.com/ChrisWren/grunt-nodemon">grunt-nodemon</a>.  Here's how I set up nodemon to run two different tasks, one without any additional node arguments which is the "production" scenario, and one with arguments (specifically, the <code class="language-bash">--debug</code> and <code class="language-bash">--debug-brk</code> arguments).</p>

<pre>
<code class="language-javascript">
nodemon: {
            dev: {
                script: "<%=pkg.main %>",
                options: {
                    ignore: ["node_modules/**", ".git/", ".sass-cache/", "public/", "Gruntfile.js"]
                }
            },
            inspect: {
                script: "<%=pkg.main %>",
                options: {
                    nodeArgs: ["<%= nodemon.args %>"],
                    ignore: ["node_modules/**", ".git/", ".sass-cache/", "public/", "Gruntfile.js"]
                }
            }
        }
</code>
</pre>

<p>We will set the <code class="language-javascript">nodemon.args</code> using <code class="language-javascript">grunt.config.set</code> inside of our task.  Here are the tasks that I'm creating:</p>
<pre>
<code class="language-javascript">
    grunt.registerTask("default", ["concat", "uglify", "imagemin", "compass:compile", "cssmin", "handlebars", "shell:app"]);
    grunt.registerTask("fork", ["concat", "uglify", "imagemin", "compass:compile", "cssmin", "handlebars", "shell:appFork"]);
    grunt.registerTask("debug", function(inspect, breakOnFirstLine){
        var nodemonTask = "dev";
        if(inspect === "inspect"){

            // switch to inspect nodemon task
            nodemonTask = "inspect";
            // set nodemon args based on breakOnFirstLine grunt argument
            grunt.config.set("nodemon.args", breakOnFirstLine === "break" ? "--debug-brk" : "--debug");

            // spawn node-inspector as a child process
            grunt.util.spawn({
                cmd: "node-inspector"
            });

            console.log("Node inspector running at http://localhost:8080/debug?port=5858");
        }
        grunt.task.run(["concat", "uglify", "imagemin", "compass:compile", "cssmin", "handlebars", "concurrent:"+nodemonTask]);
    });

</code>
</pre>

<p>This allows me to run the following grunt tasks:</p>

<ul>
<li><code class="language-bash">grunt</code> &ndash; builds front-end assets and starts the server (production scenario).</li>
<li><code class="language-bash">grunt fork</code> &ndash; same as above but forks the node process to the background (production scenario).</li>
<li><code class="language-bash">grunt debug</code> &ndash; builds front-end assets, as well as starts nodemon and any other blocking processes (compass and watch in my case).</li>
<li><code class="language-bash">grunt debug:inspect</code> &ndash; same as above, but also fires up node-inspector as a child process.  This is nice because when I stop the grunt process it will stop node-inspector as well.</li>
<li><code class="language-bash">grunt debug:inspect:break</code> &ndash; same as above, but starts the debugger with <code class="language-bash">--debug-brk</code>, which will apply that first breakpoint and allow me to better debug at server startup.</li>
</ul>

<p>I've added all of this to my boilerplate Gruntfile &ndash; have a look:</p>

<pre>
<code class="language-javascript gist-it">
<script type="text/javascript" src="http://gist-it.appspot.com/github/codyrushing/express-mvc-boilerplate/blob/master/Gruntfile.js"></script>
</code>
</pre>
