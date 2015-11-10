---
title: Migrating from WordPress to Koa
date: 03/11/15
tags: [koa, wordpress, node, javascript, es6]
intro: After over a year on WordPress, this site is now built on [Koa.js](http://koajs.com/) &ndash; the new-ish Node.js framework from the developers of Express.  And it's pretty great.
---
By the time I was ready to launch this site almost two years ago, I was already regretting choosing [WordPress](https://wordpress.org/) as a platform.  It has had an amazing history, but like many popular open-source frameworks, WordPress had become bloated and opaque.  

For the last couple of years, I have been working a lot with Node (specifically [Express](http://expressjs.com/)), and I saw that many of the developers of Express had moved on to a new framework called [Koa](http://koajs.com/).  It looked nice, so I decided to give it a go, and so far I've been happy &ndash; [Check it out on github](https://github.com/codyrushing/codyrushing).

## Why Koa?
Koa is basically Express, but lighter and with more ES6 stuff &ndash; so it was pretty easy for me to pick up.  Other than personal preference, some of the main reasons for switching to a Node-based solution were:
* WordPress' editor is about as nice as it gets as far as WYSIWYG editors go, but that's not saying much.  Markdown is a much better way to author content, and that's easier to set up with Node than WP.
* This site has always supported a single page app front-end.  I was able to make this work on WordPress by installing some plugin that allowed it to serve JSON, but that's not was WordPress was ever never designed to do.  Also, the front-end uses Handlebars for templating, and ideally those same templates would be used to render server side as well.  Trying to get WordPress to render using Handlebars sounds like a nightmare, but I'm doing it now with Koa and it's simple.  Actually, the ability to share any JavaScript code between the client and server is pretty handy.
* Obviously, you gain flexibility moving from something monolithic like WordPress to something tiny like Koa.  This site is only a blog right now, but I may want to do more with it in the future.  It's much more work to add custom functionality in WordPress compared to Koa which is completely transparent (at least to me since I'm a Node dev).
* Koa expects a certain level of ES6 features to run.  I haven't written ES6 code before, so I figure this would be a good chance to learn some of the new standards coming to JavaScript.  Which leads into my next point:

## A bit about generators
Koa uses [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators) instead of callback functions for all of the middlewares.  Having never used generators before, this was a little unfamiliar for me.  Generators functions are special functions that can be paused and resumed on demand, and can thus be used to perform asynchronous actions without the need of callback functions or Promises, so your code looks and reads more synchronous.

Seems cool, however (and maybe this is because I'm just set in my ways of asynchronous coding) I didn't find generators particularly helpful.  Generator functions allow you to use Promises to manage the control flow, instead of using the built-in `next()` method, which was confusing and unwieldy for me.  I find Promises a much easier to understand metaphor, so I opted to use those in all of my custom middlewares.  It would be a good exercise to refactor them in the proper generator fashion.

The way I feel about generators right now is the same as the way I felt about streams a year and half ago.  I realize there is some new and interesting functionality there, but I'm not quite sure how it helps me.  Now, since I have more experience with them, I use streams all of the time to handle large files, do fun things with Gulp, to deliver lots of data to the client in a piecemeal fashion, etc.  I'm sure that I'll eventually "get" why generators are so cool, but as of right now I still don't fully understand how to apply them.

## Front end changes
The front-end looks and feels almost exactly the same as it did before, but there are a few under-the-hood changes:
* __No Backbone nor jQuery__ &ndash; Backbone was being used pretty much solely for the router before.  Now, since I'm able to do more on the server, the client is allowed to be more dumb and just render whatever the server tells it, which is nice.  Also, jQuery is not necessary here; I'm using a couple of micro JavaScript libraries to handle the little bit of DOM manipulation I need ([DOMtastic](https://domtastic.js.org/)) as well as some syntactic sugar for ajax calls ([qwest](https://github.com/pyrsmk/qwest)).
* __Browserify__ &ndash; I found [Browserify](http://browserify.org/) awesome, so I'm using it here instead of concatenating a bunch of scripts and having to delicately manage a global namespace variable.  So much easier.
