---
title: Grunt has changed my life
date: 17/02/14
tags: [tools, grunt, jshint, sass, handlebars, assemble]
intro: I've only been using [Grunt](http://gruntjs.com/) for a little bit, but it has quickly become one of those "_how did I ever live without this_" kind of tools.
---

I've only been using [Grunt](http://gruntjs.com/) for a little bit, but it has quickly become one of those "_how did I ever live without this_" kind of tools.  I guess I always thought that it didn't provide anything that I couldn't do on my own; minification, concatenation, jshint can all be done with pre-existing tools.  What's nice about Grunt is that you can manage them all in one place with a single easily-customizable build process.  Not only that, but it's easy to share with other team members so y'all are all running the exact same build.

## Getting started<

I guess [I thought Grunt would be weird and hard](http://24ways.org/2013/grunt-is-not-weird-and-hard/) to start using, but the learning curve is actually surprisingly friendly.  It's straightforward javascript, and once you understand how to set up a simple task, you can pretty much do whatever you need to do.  Also, every Grunt plugin I've used seems to follow the same conventions as far as configuration options are concerned, so it's easy to pick up new plugins and start working with them.

## There's a plugin for that

Originally, I had assumed that Grunt was only for a handful of front-end javascript-related tasks.  While that's kinda true and may certainly represent the bulk of Grunt usage out there, we are starting to use it for other tasks as well.  Right now, we have a Grunt watch script that listens for any changes to our Handlebars files and automatically precompiles them for use both on the client and server.  We're also using it to generate static HTML pages from those template files using [Assemble](http://assemble.io/).  We're also using it to restart Express whenever server files are updated.  It's become such a central part of our workflow that if I want to add any feature to the project, I first check and see if there's a Grunt plugin to handle it, and more often than not there is.

## NPM

Since Grunt runs on Node.js, all Grunt packages are installed via NPM, which is pretty sweet.  Anyone can jump into the project by simply pulling down the code, running `npm install`, and starting Grunt.

## Problems?

After four weeks of using Grunt, it's been pretty painless so far.  For most things, you set up the task once and never have to think about it again.  We are using [grunt-contrib-compass](https://github.com/gruntjs/grunt-contrib-compass) to compile our SASS/Compass files.  As the amount of Compass code has grown, I've noticed the Grunt-initiated Compass compile tasks are taking longer than they should &ndash; noticeably longer than if we were running Compass by itself.  It looks like this is due to how we are using a Grunt watch instead of a Compass watch, and apparently there is a way to have Grunt use Compass watch, but it requires an additional plugin, which we probably won't bother with until it becomes more of a nuisance.  Other than that, it's been smooth sailing with Grunt.

Below is my sort-of boilerplate Gruntfile that I use to start out most projects.  It comes with Handlebars precompiling, Compass, JSHint and Uglify, and some other stuff.

__Edit:__ For performance reasons, I've started using compass' watch script instead of dropping a <code class="language-bash">compass compile</code> to my watch task.  Because `compass watch` is blocking, you won't be able to run any other blocking processes like watch or nodemon alongside it without using something like [grunt-concurrent](https://github.com/sindresorhus/grunt-concurrent), which allows you to run multiple grunt processes in parallel.

```
<script type="text/javascript" src="http://gist-it.appspot.com/github/codyrushing/express-mvc-boilerplate/blob/master/Gruntfile.js"></script>
```
