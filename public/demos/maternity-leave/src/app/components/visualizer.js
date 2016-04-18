"use strict"
import d3 from "d3"

var visualizer = {
  init: function({url, element}){
    this.root = d3.select(element)
    this.build()
    this.loadData(url, (data) => {
      this.dataset = data.filter((node, i) => {
        return node.paidLeave !== null
      })
      this.draw(this.dataset)
    })
    return this
  },
  build: function({width=960, height=600, margins={top:50, right:50, bottom:50, left:50}}={}){
    this.width = width
    this.svg = this.root.append("svg")
      .attr({
        "class": "maternity-visualizer",
        "width": width + margins.left + margins.right,
        "height": height + margins.top + margins.bottom
      })

    this.mainGroup = this.svg.append("g")
      .attr({
        "class": "main",
        "transform": `translate(${margins.left}, ${margins.top})`
      })

    this.axisGroup = {
      x: this.mainGroup.append("g").attr({
        "class": "axis x",
        "transform": `translate(0,0)`
      })
    }

    this.scale = {
      x: d3.scale.linear().range([0, width])
    }

  },
  nestedStructure: function(...props){
    var nest = d3.nest()

    props.forEach((prop) => {
      nest.key((d) => {
        return this.getNumericSafe(d[prop], null)
      })
    })

    nest.sortKeys(function(a,b){
      a = a === "null" ? -1 : parseInt(a, 10)
      b = b === "null" ? -1 : parseInt(b, 10)
      return d3.ascending(a,b)
    })

    return nest
  },
  getNumericSafe: function(val, fallback=0){
    return !isNaN(val) ? val : fallback
  },
  xAccessor: function(d){
    return d.paidLeave
  },
  reduceTotalWeeks: function(arr){
    return arr.reduce((a,b) => {
      return a + this.getNumericSafe(b.paidLeave) + this.getNumericSafe(b.unpaidLeave)
    }, 0)
  },
  weeksToRadius: function(weeks){
    return Math.sqrt(weeks) + 1
  },
  processSectionsByPaid: function(sectionsByPaid){
    // width of sections are based upon their largest cluster
    // so we first extract all of the largest clusters
    var maxClusters = sectionsByPaid.map((section, i) => {
      var max, maxValue = 0;
      section.subsectionsByUnpaid = this.nestedStructure("unpaidLeave").entries(section.values).reverse()
      section.subsectionsByUnpaid.forEach((subsection) => {
        var subsectionWeeks = this.reduceTotalWeeks(subsection.values)
        if (subsectionWeeks > maxValue) {
          maxValue = subsectionWeeks
          max = subsection
        }
      })
      return max
    })

    var totalMaxClusterRadius = maxClusters.reduce((a,b) => {
      return a + Math.sqrt(this.reduceTotalWeeks(b.values))
    }, 0)

    var totalMaxClusterWeeks = this.reduceTotalWeeks(
      maxClusters.reduce((a,b) => {
        return a.concat(b.values)
      }, [])
    )

    sectionsByPaid.forEach((section,i) => {
      var prev = sectionsByPaid[i-1] || {x0: 0, x1:0}
      // use the number of weeks in our max cluster to determine width of section
      section.width = Math.sqrt(this.reduceTotalWeeks(maxClusters[i].values)) / totalMaxClusterRadius * this.width
      section.x0 = prev.x1
      section.x1 = section.x0 + section.width

      // begin building out the clusters for each section
      this.processSubsectionsByUnpaid(
        section,
        section.subsectionsByUnpaid
      )

    })
  },
  processSubsectionsByUnpaid: function(section, subsectionsByUnpaid){
    var yOffset = 0
    subsectionsByUnpaid.forEach((subsection, i) => {
      var radius = this.weeksToRadius(this.reduceTotalWeeks(subsection.values)),
          packingBoxDimensions = [1, 1],
          clusterData = {
            radius: radius,
            x: section.x0 + section.width/2,
            y: yOffset + radius * 1.5
          }

      // this.mainGroup.append("rect")
      // .attr("x", clusterData.x-1)
      // .attr("y", clusterData.y-1)
      // .attr("key", subsection.key)
      // .attr("radius", radius)
      // .attr("width", 2)
      // .attr("height", 2)
      // .attr("r", 1)
      // .attr("fill", "red")

      subsection.values.forEach((node, i, arr) => {
        node.radius = this.weeksToRadius(this.reduceTotalWeeks([node]))
        node.cluster = clusterData
      })

      var packedLayout = d3.layout.pack()
        .size(packingBoxDimensions)
        .padding(10)
        .value((d) => {
          return d.radius * d.radius
        })
        .nodes({
          children: subsection.values
        })

      subsection.values.forEach((node,i) => {
        node.x += node.cluster.x - packingBoxDimensions[0]/2 + Math.random()
        node.y += node.cluster.y - packingBoxDimensions[1]/2 + Math.random()
      })

      yOffset += radius * 3
    })
  },
  draw: function(){
    this.scale.x
      .domain( d3.extent(this.dataset.map(this.xAccessor)) )

    this.processSectionsByPaid(
      this.nestedStructure("paidLeave").entries(this.dataset)
    )

    this.bubbles = this.mainGroup.selectAll("circle")
      .data(this.dataset)
      .enter().append("circle")
      .attr('stroke-width', 1)
      .attr("stroke", "#ccc")
      .attr("fill", "none")
      .attr('paid', function (d) { return d.paidLeave; })
      .attr('unpaid', function (d) { return d.unpaidLeave || "null"; })
      .attr('name', function(d) { return d.name; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr('r', function (d) { return d.radius; })

    var force = d3.layout.force()
        .nodes(this.dataset)
        .size([this.width, this.height])
        .gravity(0)
        .charge(0)
        .friction(0)
        .on("tick", (e) => {
          return this.onTick(e)
        })

    force.start()

    for(var i=0; i>0; i--){
      // force.tick()
    }

    this.bubbles.transition()
      .duration(1500)
      .attrTween("r", function(d) {
        var i = d3.interpolate(0, d.radius);
        return function(t) { return d.radius = i(t); };
      })

  },
  onTick: function(e) {
    this.bubbles
      // .each(this.bounceBack(e.alpha))
      // .each(this.moveTowardCluster.call(this, e.alpha))
      .each(this.collide.call(this, 0.5))
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr('r', function (d) { return d.radius; })
  },
  moveTowardCluster: function(alpha){
    var damper = 0.202
    return (d) => {
      d.x = d.x + (d.cluster.x - d.x) * damper * alpha
      d.y = d.y + (d.cluster.y - d.y) * damper * alpha
    }
  },
  bounceBack: function(alpha){
    var ctx = this
    return (d) => {
      if (d.x < 0 || d.x > ctx.width){
        let vX = d.x - d.px
        d.x = d.x - vX
      }
      if (d.y < 0 || d.y > ctx.height){
        let vY = d.y - d.py
        d.y = d.y - vY
      }
    }
  },
  collide: function(alpha){
    var padding = 0, // separation between same-color nodes
    clusterPadding = 5, // separation between different-color nodes
    maxRadius = this.weeksToRadius(52);

    var quadtree = d3.geom.quadtree(this.dataset);
    return function(d) {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  },
  loadData: function(url, done){
    if(!url) throw new Error("Data url must be provided")
    d3.csv(url, function(d){
      return {
        id: +d.id,
        name: d.name,
        industry: d.industry,
        subclassification: d.subclassification,
        paidLeave: d.leave_paid !== "null" || d.leave_paid === "" ? +d.leave_paid : null,
        unpaidLeave: d.leave_unpaid !== "null" || d.leave_unpaid === "" ? +d.leave_unpaid : null
      }
    }, done)

  }
}

export default visualizer
