* Paid leave needs to be the primary metric
* Problems
  * Too many data points have the exact same value
  * Too many values maybe
  * Possibly two values for each entity (paid and unpaid), but may just have a single value

* Create nested structure based on paid, then unpaid
* Create scale (ordinal or linear?) for each paid cohort on x axis
  * subdivide those sections into subsections for each unpaid cohort
    * start at the top, so companies with the most unpaid are at the top, and move down from there
    * so each major paid cohort will have its own scale
  * once you have those rectangles, pack that shit in.  [here's how](http://bl.ocks.org/seliopou/4127259)
  * [best explanation of quantile and quantize scales](http://www.jeromecukier.net/blog/2011/08/11/d3-scales-and-color/)

* A completely different idea:
  * each company's radius is given by its total # of weeks of leave
    * unpaid proportion represented by a piece of semi-transparent pie
    * paid proportion represented by opaque pie
  * still keep the x axis for paid leave
  * still color code for industry
  * since

__Problem__ : some nodes are getting mixed into the wrong cluster.  i think this is because of the initial placement which causes huge collision effects
* place nodes radially around cluster in such a way they don't overlap


[Good explanation of force layout](http://bl.ocks.org/sathomas/11550728)

The problem is how the nodes are positioned around the cluster in the initialization
> Each node is slightly offset from the corresponding cluster’s center using Math.random. Without this offset, same-colored nodes would be coincident, which would cause divide-by-zero problems for our custom forces.

More good examples:
* [Gravity bubbles](http://www.triadsoft.com.ar/examples/gravity-bubbles.html)
* [Gates foundation spending](http://vallandingham.me/bubble_chart/)
  * [article](http://vallandingham.me/bubble_charts_in_js.html) and [annotated source](https://github.com/vlandham/bubble_chart/blob/gh-pages/src/bubble_chart.js)

## Media
* [Time article](http://time.com/3984870/netflix-parental-leave/)
