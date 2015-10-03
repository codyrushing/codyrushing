---
title: Using Handlebars helpers on both client and server
date: 16/03/15
tags: [handlebars, javascript, isomorphic, node, grunt, express]
intro: Handlebars has great support for building custom helpers, but there isn't an obvious way to get them working for both client and server-side rendering.
---

<p>Handlebars has great support for building custom helpers, but there isn't an obvious way to get them working for both client and server-side rendering.  To me, the holy grail of single page web apps is to have every URL completely shareable, and not reliant upon client side rendering on initial page load.  Subsequent navigation by the user can all be done via AJAX and client-side rendering, but every URL needs to be able to be rendered on the server without the help of the client.  This makes SEO much simpler, is a better experience for the user, and overall I think it's just more inline with how the web was built to work.</p>

<p>To go with this strategy, though, you will need to support potentially two different request paradigms (traditional page load and single-page app async calls).  As such, you'll need to be able to use your templates on both the client and the server.  Handlebars is supported by many server stacks, so we should be able to use our templates wherever we need them, right?</p>

<h2>But what about my custom helpers?</h2>

<p>Custom helpers are one of the best features of Handlebars.  They are written in javascript, which makes it dead simple to deliver them to the client.  But using them on the server is not so simple.  Every server-side rendering environment is different in the way that it consumes helpers.  So, the trick is to build a single set of helpers that can be consumed both by the client and the server.</p>

<p>Check out the helpers file below.</p>

<pre>
<code class="language-javascript">(function() {
    var register = function(Handlebars) {

        /************* BEGIN HELPERS *************/
        var helpers = {
            // put all of your helpers inside this object
            foo: function(){
                return "FOO";
            },
            bar: function(){
                return "BAR";
            }
        };
        /************* END HELPERS *************/

        if (Handlebars && typeof Handlebars.registerHelper === "function") {
            // register helpers
            for (var prop in helpers) {
                Handlebars.registerHelper(prop, helpers[prop]);
            }
        } else {
            // just return helpers object if we can't register helpers here
            return helpers;
        }
    };

    // client
    if (typeof window !== "undefined") {
        register(Handlebars);
    }
    // server
    else {
        module.exports.register = register;
        module.exports.helpers = register(null);
    }
})();</code>
</pre>

<p>So we have a <code class="language-javascript">register</code> function which is designed to have Handlebars passed into it.  It houses all of our helpers, and if it has access to Handlebars it will register them using Handlebars' <code class="language-javascript">registerHelper</code> method.  Then at the end of the file we determine whether or not we are in a client or server environment by checking for the existence of the <code class="language-javascript">window</code> object.  I'm not crazy about this approach, but it seems to work for now.  If we're in a browser, we go ahead and call our register method to register our helpers.  If we're in a server environment, we export the register function (as well as the standalone helpers object, just in case we need it) to be used elsewhere in our Node.js app.</p>

<p>So our client app is ready to go with helpers &ndash; now let's see how to set them up on the server.</p>

<h2>Server-side example 1 : Express</h2>

<p><a href="https://github.com/ericf/express3-handlebars">express3-handlebars</a> is an improved version of Handlebars for use server-side with Express.  If you're going to be using Handlebars with Express, I highly recommend using this implementation instead of the plain Handlebars package.  Here's how you would set it up to read your custom helpers:</p>

<pre class="language-javascript"><code>var app = express(),
    exphbs = require("express3-handlebars");

app.engine("hbs", exphbs({
    defaultLayout: "main",
    extname: ".hbs",
    helpers: require("./public/js/helpers.js").helpers, // same file that gets used on our client
    partialsDir: "views/partials/", // same as default, I just like to be explicit
    layoutsDir: "views/layouts/" // same as default, I just like to be explicit
}));
app.set("view engine", "hbs");
</code></pre>

<p>Pretty straightforward.  We just require our helpers file, and feed it just the helpers object which contains all of our helper methods  Behind the scenes, express3-handlebars will register the helpers on its own using <code class="language-javascript">registerHelper</code>.</p>

<h2>Server-side example 2 : Assemble</h2>

<p><a href="http://assemble.io">Assemble</a> is static site generator that runs on Node.js and is configurable through Grunt (win).  We've been using it on a project to quickly crank out static html deliverables powered by Handlebars.</p>

<p>You can set up your Assemble task inside of Grunt like so:</p>

<pre><code class="language-javascript">assemble: {
    options: {
        layoutdir: 'views/layouts',
        partials: ['views/partials/**/*.hbs'],
        helpers: ["public/js/helpers.js"],
        layout: "main.hbs"
    },
    home: {
        src: ['views/home.hbs'],
        dest: 'public/home.html'
    }
}
</code></pre>

<p>Again, pretty easy.  You just point the helpers key to the path of your helpers file, and because of the way that file is set up, Assemble is able to find and use those helpers.</p>

<h2>Getting fancy</h2>

<p>Everything we've done so far will work for simple helpers like the ones in our example, but what if you want to have a helper that, for example, will find a particular partial based a string name that you pass it and include it on the page?  Consider this helper which does exactly that:</p>

<pre><code class="language-javascript">getPartialByName: function(name, data, options) {
    var template = Handlebars.partials[name];
    if (template) {
        if (typeof template !== 'function') {
            template = Handlebars.compile(template);
        }
        return template(data, options);
    }
}
</code></pre>

<p>I'm calling helpers like this <strong>advanced helpers</strong> since they require access to the <code class="language-javascript">Handlebars</code> instance, which unfortunately is not exposed to express3-handlebars (sad).  So, we'll have to change our Express configuration to get around this and expose the stuff we need.</p>

<p><strong>A quick note on client-side partial lookups:</strong> if you are using Grunt to precompile your templates and partials for use on the client (which you should be since it's faster), you should know that it dumps them all into a single namespace that you set.  For example, I compile mine to <code class="language-javascript">Handlebars.templates</code>, but you could compile yours to <code class="language-javascript">app.templates</code> or whatever else.  As such, <code class="language-javascript">Handlebars.partials</code> which is the default namespace that Handlebars uses to lookup partials, will be empty because no partials were loaded using the loadPartial method.  This is only necessary on the client because it's the client-side precompiled templates that get all loaded into a single namespace.  To fix this, we'll need to point <code class="language-javascript">Handlebars.partials</code> to our precompiled template namespace.  Let's do that in the client block of our helpers file.</p>

<pre><code class="language-javascript">// client
if (typeof window !== "undefined") {
    // since all partials and templates precompiled into the same bucket, do this to allow partial lookups to work
    Handlebars.partials = Handlebars.templates;
    register(Handlebars);
}
</code></pre>

<p>You could avoid this by precompiling your partials separately from your templates into <code class="language-javascript">Handlebars.partials</code> if you want.  It would require two different precompilation steps, but I suppose that's no big deal.  Or, if you're not precompiling you partials on the client-side, and are instead using the <code class="language-javascript">Handlebars.registerPartial</code> method, then you can ignore the step above.</p>

<p>Ok, so now that we know our partials namespace is working, we need to change our express3-handlebars configuration so that it passes the current Handlebars instance into the helpers register function, that way it can use it to look up partials.</p>

<pre class="language-javascript"><code>var hbs = exphbs.create({
    defaultLayout: "main",
    extname: ".hbs",
    partialsDir: 'views/partials/', // same as default, I just like to be explicit
    layoutsDir: "views/layouts/" // same as default, I just like to be explicit
});

// register helpers after partials have loaded, and pass Handlebars instance into register function
hbs.loadPartials(function(err, partials){
	// attach partials to Handlebars instance, exposing them to helpers
	hbs.handlebars.partials = partials;
	require("./public/js/helpers").register(hbs.handlebars);
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
</code></pre>

<p>express3-handlebars allows you create an instance of exphbs.  The exphbs instance stores a Handlebars instance on the <code class="language-javascript">.handlebars</code> key.  exphbs also exposes a <code class="language-javascript">loadPartials</code> method, which returns a function that has all of the partials.  So, similar to what we did on the client side, we can point the <code class="language-javascript">.partials</code> key on the Handlebars instance to our partials object from <code class="language-javascript">loadPartials</code>.  Then, we can take that modified Handlebars intance, which now has its partials namespace populated, and pass it to our helpers register function.  Now, all of our helpers have access to the partials namespace.</p>

<h2>What about Assemble?</h2>

<p>Assemble not only runs the helper register function on its own, but it also automatically passes in a Handlebars instance into the register method <strong>AND</strong> populates the partials namespace before registering any helpers.  So there's no additional setup to get advanced helpers working on Assemble &ndash; which is pretty great.</p>

<p class="divider">This whole approach is made possible by writing <strong>isomorphic javascript</strong>, which is javascript that can run both on the client and the server.  A lot of people <a href="http://nerds.airbnb.com/isomorphic-javascript-future-web-apps/">think this is the future of web apps</a>, and while don't necessarily 100% agree with that, it does make for some interesting possibilities.  I'm not a huge fan of doing a bunch of "if server else client" checks in my code, but I'm sure someone will come up with a more elegant solution.</p>

<p>All of the code featured here is <a href="https://github.com/codyrushing/express-mvc-boilerplate">up on my Express MVC boilerplate app Github</a>, so you play around with it and see how it actually works.</p>
