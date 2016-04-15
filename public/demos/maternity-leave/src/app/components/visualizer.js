"use strict"
import d3 from "d3"

var visualizer = {
  init: function({url, element}){
    this.root = d3.select(element)
    this.build()
    this.loadData(url, (data) => {
      this.dataset = data
      this.draw(this.dataset)
    })
    return this
  },
  build: function({width=800, height=600, margins={top:50, right:50, bottom:50, left:50}}={}){
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

    this.axis = {
      x: d3.svg.axis().scale(this.scale.x).ticks(10).tickSubdivide(10).tickSize(10,10,-10).orient("bottom")
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
    return Math.sqrt(weeks) * 2
  },
  processSectionsByPaid: function(sectionsByPaid){
    var totalWeeks = this.reduceTotalWeeks(this.dataset)

    sectionsByPaid.forEach((section,i) => {
      let prev = sectionsByPaid[i-1] || {x0: 0, x1:0}
      section.totalWeeks = this.reduceTotalWeeks(section.values)
      section.width = section.totalWeeks / totalWeeks * this.width
      section.x0 = prev.x1
      section.x1 = section.x0 + section.width

      // for debugging
      // this.mainGroup.append("rect")
      //   .attr({
      //     x: section.x0,
      //     y: 0,
      //     width: section.width,
      //     height: 200,
      //     fill: "blue"
      //   })

      // begin building out the clusters for each section
      this.processSubsectionsByUnpaid(
        section,
        this.nestedStructure("unpaidLeave").entries(section.values).reverse()
      )

    })
  },
  processSubsectionsByUnpaid: function(section, subsectionsByUnpaid){
    var yOffset = 0
    subsectionsByUnpaid.forEach((subsection, i) => {
      var radius = this.weeksToRadius(this.reduceTotalWeeks(subsection.values)),
          y = yOffset + radius/2,
          clusterData = {
            radius: radius,
            x: section.x0 + (section.x1 - section.x0)/2 + Math.random(),
            y: y + Math.random()
          }

      subsection.values.forEach((node) => {
        // merge clusterData onto node
        ["x", "y"].forEach((key) => {
          node[key] = clusterData[key]
        })
        node.radius = this.weeksToRadius(this.reduceTotalWeeks([node]))
        node.cluster = this.clusters.length
      })

      this.clusters.push(clusterData)

      yOffset += radius

    })
  },
  draw: function(){
    this.scale.x
      .domain( d3.extent(this.dataset.map(this.xAccessor)) )

    this.clusters = []

    this.processSectionsByPaid(
      this.nestedStructure("paidLeave").entries(this.dataset)
    )

    var force = d3.layout.force()
        .nodes(this.dataset)
        .size([this.width, this.height])
        .gravity(.02)
        .charge(0)

    this.companyNodes = this.mainGroup.selectAll("circle")
      .data(this.dataset)
      .enter().append("circle")

    // Run the layout a fixed number of times.
    // The ideal number of times scales with graph complexity.
    // Of course, don't run too long—you'll hang the page!
    force.start()
    for (var i = 100; i > 0; --i){
      this.onTick({alpha: 0.5})
    }
    force.stop()

    console.log("finished simulating")

    this.companyNodes
      .attr("cx", function(d) {
        return Math.round(d.x)
      })
      .attr("cy", function(d) {
        return Math.round(d.y)
      })
      .attr("r", function(d) {
        return d.radius
      })
      .attr("name", function(d) {
        return d.name
      })

    this.axisGroup.x.call(this.axis.x)
  },
  onTick: function(e) {
    this.companyNodes
        .each(this.cluster.call(this, 10 * e.alpha * e.alpha))
        .each(this.collide.call(this, .5))
        // .attr("cx", function(d) { return d.x; })
        // .attr("cy", function(d) { return d.y; })
        // .attr("r", function(d) {
        //   return d.radius
        // })
  },
  // Move d to be adjacent to the cluster node.
  cluster: function(alpha) {
    return (d) => {
      var cluster = this.clusters[d.cluster];
      if (cluster.x !== d.x && cluster.y !== d.y){
        if(isNaN(d.x) || isNaN(cluster.x)){
          debugger
        }
        if(isNaN(d.y) || isNaN(cluster.y)){
          debugger
        }
        var x = d.x - cluster.x,
            y = d.y - cluster.y,
            l = Math.sqrt(Math.max([x * x + y * y, 1])),
            r = d.radius + cluster.radius;
        if (l != r) {
          l = (l - r) / l * alpha;
          if(isNaN(x*l)){
            debugger
          }
          if(isNaN(y*l)){
            debugger
          }
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      }
    };
  },
  // Resolves collisions between d and all other circles.
  collide: function(alpha) {
    var quadtree = d3.geom.quadtree(this.dataset),
        padding = 1.5, // separation between same-color nodes
        maxRadius = 12,
        clusterPadding = 6; // separation between different-color nodes

    return (d) => {
      var r = d.radius + Math.max(padding, clusterPadding),
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && quad.point.x !== d.x && quad.point.y !== d.y) {
          if (isNaN(d.x) && isNaN(quad.point.x)){
            debugger
          }
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(Math.max([x * x + y * y, 1])),
              r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
          if (l < r) {
            l = (l - r) / l * alpha;
            if(isNaN(x*l)){
              debugger
            }
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
