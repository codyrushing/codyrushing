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


[Good explanation of force layout](http://bl.ocks.org/sathomas/11550728)
