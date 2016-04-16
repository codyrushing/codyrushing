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
  constants: {
    DAMPER: 0.102
  },
  build: function({width=600, height=400, margins={top:50, right:50, bottom:50, left:50}}={}){
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
    return Math.sqrt(weeks)
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

      subsection.values.forEach((node, i, arr) => {
        var angle = Math.PI * 2 / arr.length * i+1

        node.radius = this.weeksToRadius(this.reduceTotalWeeks([node]))
        node.cluster = clusterData
        // set initial position of each node to be all around the cluster
        node.x = node.cluster.x + Math.cos(angle) * node.radius + Math.random()
        node.y = node.cluster.y + Math.sin(angle) * node.radius + Math.random()
      })

      yOffset += radius

    })
  },
  charge: function(d){
    return -Math.pow(d.radius, 2.0) / 8;
  },
  draw: function(){
    this.scale.x
      .domain( d3.extent(this.dataset.map(this.xAccessor)) )

    this.processSectionsByPaid(
      this.nestedStructure("paidLeave").entries(this.dataset)
    )

    var force = d3.layout.force()
        .nodes(this.dataset)
        .size([this.width, this.height])
        .gravity(0)
        .friction(0.9)
        .charge(this.charge)
        .on("tick", (e) => {
          return this.onTick(e)
        })

    force.start()

    setTimeout(() => {
      // console.log("stopping")
      // force.stop()
    }, 10000)

    console.log(this.dataset)

    this.bubbles = this.mainGroup.selectAll("circle")
      .data(this.dataset)
      .enter().append("circle")
      .attr('r', 0)
      .attr('stroke-width', 1)
      .attr("stroke", "red")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("fill", "none")
      .attr('r', function (d) { return d.radius; });

    this.bubbles.transition()
      .duration(1000)
      .attr('r', function (d) { return d.radius; });


    // Run the layout a fixed number of times.
    // The ideal number of times scales with graph complexity.
    // Of course, don't run too long—you'll hang the page!

    // this.axisGroup.x.call(this.axis.x)
  },
  onTick: function(e) {
    console.log(e)
    this.bubbles
      .each(this.moveTowardCluster(e.alpha))
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
  },
  moveTowardCluster: function(alpha){
    var damper = 0.102
    return (d) => {
      d.x = d.x + (d.cluster.x - d.x) * damper * alpha * 1.1
      d.y = d.y + (d.cluster.y - d.y) * damper * alpha * 1.1
    }
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
