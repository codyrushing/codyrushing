---
title: Animated donut charts with D3
date: 11/05/14
tags: [javascript, d3, data visualization]
intro: D3 donut charts have been done before, but I wasn't able to find one that had everything I needed.  So I went ahead and made a simple utility class for creating and animating donut charts.
---

D3 donut charts have been done before, but I wasn't able to find one that had everything I needed.  So I went ahead and made a simple utility class for creating and animating donut charts.  <a href="https://github.com/codyrushing/donut-chart" target="_blank">Check it out on the githubs</a>.

<iframe src="/public/demos/donut-chart/spurs.html" height="320" width="320"></iframe>

<p>D3 now has now built in <a href="https://github.com/mbostock/d3/wiki/Pie-Layout" target="_blank">a more streamlined Pie API for pie and donut charts</a>.  However, I wanted mine to have more features (layout control, extendibility, partial donuts, multiple data points, transitions with custom callbacks, etc), and it was easier to implement those features by drawing my own arcs.</p>

<p>I've designed them to be used for progress-style data, such as "user has accumulated X number of points out of a total possible Y."  So it requires not just an array of data points, but also a total.  I may refactor it down the road to be a little more flexible as far as data is concerned.</p>

<h2>Thoughts on D3</h2>
<p>This is my first time working with D3, but would definitely like to use it more.  It's a very dense library, but the API is pretty consistent and well-designed from what I can tell.  A couple quick takeaways:</p>
<ul>
<li>Transitions are done differently than what I'm used to, but the more I worked with it the more it started to make sense.  Getting a simple transition complete callback to work was a little convoluted  &ndash; you basically have to queue up an additional transition that does nothing but execute your callback.  You can listen for the "end" event of a transition, but if there are multiple donut charts on the page transitioning at the same time, only one "end" will fire instead of firing once for each donut chart (see the <a href="https://github.com/mbostock/d3/wiki/Transitions#each" target="_blank">docs on transitions</a> for more info about this).</li>
<li>It's pretty crucial to understand the way the select engine works, as well as enter and exit "loops".  Coming from jQuery-style DOM selecting, it was hard to understand that you select for something before it exists, and then throw that empty selection into an enter loop and start building it out.</li>
<li>There's a ton of good D3 code out there.  If you're not sure how to do something with D3, just google it and you'll likely find something similar that will get you started in the right direction.
</ul>
