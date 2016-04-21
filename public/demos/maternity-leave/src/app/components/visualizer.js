"use strict"
import d3 from "d3"
import isotip from "isotip"

import tooltipTemplate from "../templates/tooltip"

var visualizer = {
  init: function({url, element}){
    this.root = d3.select(element)
    this.initDOM()
    isotip.init({
      html: true,
      removalDelay: 0
    })
    this.loadData(url, (data) => {
      this.dataset = data.filter((node, i) => {
        return node.paidLeave !== null
      })
      this.processData()
      this.draw(this.dataset)
    })
    return this
  },
  initDOM: function({width=960, height=600, margins={top:50, right:50, bottom:50, left:120}}={}){
    this.width = width
    this.margins = margins
    this.svg = this.root.append("svg")
      .attr({
        "class": "maternity-visualizer",
        "width": width + margins.left + margins.right,
        "height": height + margins.top + margins.bottom,
        "shape-rendering": "crispEdges"
      })

    let defs = this.svg.append("defs")
    defs.append("pattern")
      .attr({
        id: "pattern-stripe",
        width: 1.5,
        height: 1.5,
        patternUnits: "userSpaceOnUse",
        patternTransform: "rotate(45)"
      })
        .append("rect")
        .attr({
          width: 0.75,
          height: 1.5,
          transform: "translate(0,0)",
          fill: "white"
        })

    defs.append("mask")
      .attr("id", "mask-stripe")
        .append("circle")
        .attr({
          cx: 0,
          cy: 0,
          r: this.width,
          fill: "url(#pattern-stripe)"
        })
/*
<pattern id="pattern-stripe"
  width="2" height="2"
  patternUnits="userSpaceOnUse"
  patternTransform="rotate(45)">
  <rect width="1" height="2" transform="translate(0,0)" fill="white"></rect>
</pattern>
<mask id="mask-stripe">
  <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-stripe)" />
</mask>
*/

    // this.svg.append("rect")
    //   .attr({
    //     x: 100,
    //     y: 100,
    //     width: 400,
    //     height: 400
    //   })
    //   .style("mask", "url(#mask-stripe)")


    this.mainGroup = this.svg.append("g")
      .attr({
        "class": "main",
        "transform": `translate(${margins.left}, ${margins.top})`
      })

    this.axisGroup = {
      x: this.svg.append("g").attr({
        "class": "axis x",
        "transform": `translate(${margins.left},${margins.top - 10})`
      })
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
  processSectionsByIndustry: function(sectionsByIndustry){
    sectionsByIndustry.forEach((section) => {
      section.mean = d3.mean(section.values, this.xAccessor)
      section.median = d3.median(section.values, this.xAccessor)

      section.values.forEach((node) => {
        node.sections = (node.sections || {})
        node.sections.byIndustry = section
        node.diffFromMeanOverall = (node.paidLeave - this.overall.mean) / this.overall.mean
        node.diffFromMeanIndustry = (node.paidLeave - section.mean) / section.mean
        node.diffFromMedianOverall = (node.paidLeave - this.overall.median) / this.overall.median
        node.diffFromMedianIndustry = (node.paidLeave - section.median) / section.median
      })

    })

    sectionsByIndustry.sort((a,b) => {
      if(b.key === "N/A") return -1
      if(a.key === "N/A") return 1
      return b.median - a.median
    })
  },
  processSectionsByPaid: function(sectionsByPaid){
    // width of sections are based upon their largest cluster
    // so we first extract all of the largest clusters
    var sectionPadding = 8,
        workableWidth = this.width - sectionsByPaid.length * sectionPadding * 2

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
      section.width = Math.sqrt(this.reduceTotalWeeks(maxClusters[i].values)) / totalMaxClusterRadius * workableWidth
      section.x0 = prev.x1 + sectionPadding
      section.x1 = section.x0 + section.width + sectionPadding

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
          },
          packLayout

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

      packLayout = d3.layout.pack()
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
  slugify: function(s){
    return s.toLowerCase().replace(/[^a-zA-Z\d\s:]/g, "").replace(/\s+/g,"-")
  },
  draw: function(){
    var self = this

    this.axisGroup.x.append("line")
      .attr("class", "line")
      .attr("x1", 0)
      .attr("x2", this.width)

    // axis labels
    this.axisLabelsGroup = this.axisGroup.x
      .append("g")
      .attr("class", "label-group")
      .attr("transform", `translate(-10,-2)`)

    this.axisLabelsGroup
      .append("text")
      .attr("class", "heading")
      .attr("dy", "-0.7em")
      .text("Paid leave")

    this.axisLabelsGroup
      .append("text")
      .attr("class", "heading-unit")
      .text("(weeks)")

    var xTickGroups = this.axisGroup.x.selectAll("g.tick")
      .data(this.sections.byPaid)
      .enter()
      .append("g")
      .attr("class", "tick")
      .attr("transform", (d) => `translate(${d.x0 + d.width/2}, 0)`)

    // tick labels
    xTickGroups
      .append("text")
      .text((d) => d.key)
      .attr("y", "-0.5em")
      .attr("dy", "0")

    // tick notches
    xTickGroups
      .append("line")
      .attr("y1", 0)
      .attr("y2", 5)


    this.bubbleGroups = this.mainGroup.selectAll("g.bubble-group")
      .data(this.dataset)
      .enter().append("g")
      .attr("transform", (d) => {
        return `translate(${d.x},${d.y})`
      })
      .attr("class", (d) => {
        var classes = [this.slugify(d.industry)]
        if(d.subclassification){
          classes.push(this.slugify(d.subclassification))
        }
        return classes.join(" ")
      })
      .classed("bubble-group", true)
      .on("mouseover", function(d){
        setTimeout(() => {
          isotip.open(this, {
            content: tooltipTemplate(d)
          })
        }, 0)
      })
      .on("mouseout", function(d){
        isotip.close()
      })
      .each(function(d,i){
        var group = d3.select(this),
            totalWeeks = self.reduceTotalWeeks([d]),
            paidAngle = d.paidLeave/totalWeeks * (Math.PI * 2),
            arc = d3.svg.arc()
              .innerRadius(0)
              .outerRadius(d.radius)
              .startAngle(0)

        if(d.unpaidLeave){
          group.append("path")
            .datum({
              startAngle: paidAngle,
              endAngle: Math.PI * 2
            })
            .attr("class", "unpaid-portion")
            .attr("d", arc)
            .style("fill", self.scale.color(d.paidLeave))
            .style("mask", 'url("#mask-stripe")')
        }
        if(d.paidLeave){
          group.append("path")
            .datum({
              endAngle: paidAngle
            })
            .attr("class", "paid-portion")
            .style("fill", self.scale.color(d.paidLeave))
            .attr("d", arc)
        }
      })

    this.bubbles = this.bubbleGroups.append("circle")
      .attr("stroke-width", 1)
      .attr("stroke", (d) => {
        return d3.lab(this.scale.color(d.paidLeave)).darker(0.5)
      })
      .attr("fill", "none")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", function (d) { return d.radius; })

    this.forceLayout = d3.layout.force()
      .nodes(this.dataset)
      .size([this.width, this.height])
      .gravity(0)
      .charge(0)
      .friction(0)
      .on("tick", (e) => {
        return this.onTick(e)
      })
      .start()

    // for(var n=100; n>0; n--){
    //   this.forceLayout.tick()
    // }
    //
    // this.forceLayout.stop()
  },
  processData: function(){
    this.overall = {
      mean: d3.mean(this.dataset, this.xAccessor),
      median: d3.mean(this.dataset, this.xAccessor)
    }

    this.sections = {
      byPaid: this.nestedStructure("paidLeave").entries(this.dataset),
      byIndustry: d3.nest().key((d) => d.industry).entries(this.dataset)
    }

    this.scale = {
      color: d3.scale.linear()
          .domain( d3.extent(this.dataset.map(this.xAccessor)) )
          .range(["#00A4FF", "#06D800"])
          .interpolate(d3.interpolateLab)
    }

    this.processSectionsByIndustry(this.sections.byIndustry)
    this.processSectionsByPaid(this.sections.byPaid)

  },
  onTick: function(e) {
    if(e.alpha < 0.05){
      this.forceLayout.stop()
    } else {
      this.bubbleGroups
        // .each(this.moveTowardCluster.call(this, e.alpha))
        // .each(this.cluster.call(this, e.alpha))
        .each(this.collide.call(this, 0.5))
        .attr("transform", (d) => {
          return `translate(${d.x},${d.y})`
        })
        // .each(this.bounceBack(e.alpha))
        // .attr("cx", function(d) { return d.x; })
        // .attr("cy", function(d) { return d.y; })
        // .attr("r", function (d) { return d.radius; })

    }
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
  cluster: function(alpha){
    return function(d) {
      var cluster = d.cluster;
      if (cluster === d) return;
      var x = d.x - cluster.x,
          y = d.y - cluster.y,
          l = Math.sqrt(x * x + y * y),
          r = d.radius + cluster.radius;
      if (l != r) {
        l = (l - r) / l * alpha;
        d.x -= x *= l;
        d.y -= y *= l;
        cluster.x += x;
        cluster.y += y;
      }
    };
  },
  collide: function(alpha){
    var padding = 0, // separation between same-color nodes
        clusterPadding = 10, // separation between different-color nodes
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
