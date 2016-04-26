"use strict"
import d3 from "d3"
import isotip from "isotip"

import tooltipTemplate from "../templates/tooltip"
import overallControlsTemplate from "../templates/overall-controls"

var visualizer = {
  init: function({url, element}){
    this.root = d3.select(element)
      .classed("maternity-visualizer", true)

    this.forceTemperature = 0.5

    this.clusterKey = "all"

    isotip.init({
      html: true,
      removalDelay: 0
    })

    this.initDOM()

    this.loadData(url, (data) => {
      this.dataset = data.filter((node, i) => {
        return node.paidLeave !== null
      })
      this.processData()
      this.draw(this.dataset)
    })
    return this
  },
  initDOM: function({width=1100, height=600, margins={top:75, right:0, bottom:50, left:120}}={}){
    this.width = width
    this.margins = margins
    this.sectorMargins = {
      top: 150
    }

    this.root
      .style("width", `${this.width + this.margins.left + this.margins.right}px`)

    this.overallControls = this.root.append("div")
      .attr("class", "overall-controls")
      .style("padding-left", `${this.margins.left}px`)
      .html(overallControlsTemplate({
        margins: this.margins
      }))

    this.graphContents = this.root.append("div")
      .attr("class", "graph-contents")

    this.svg = this.graphContents.append("svg")
      .attr({
        "class": "graph",
        "width": width + margins.left + margins.right,
        "height": height + margins.top + margins.bottom,
        "shape-rendering": "crispEdges"
      })

    this.defs = this.svg.append("defs")

    this.defs.append("pattern")
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

    this.defs.append("mask")
      .attr("id", "mask-stripe")
        .append("circle")
        .attr({
          cx: 0,
          cy: 0,
          r: this.width,
          fill: "url(#pattern-stripe)"
        })

    this.mainGroup = this.svg.append("g")
      .attr({
        "class": "main",
        "transform": `translate(${margins.left}, ${margins.top})`
      })

    this.bindEvents()

  },
  bindEvents: function(){
    var input = this.overallControls.select("input"),
        buttons = this.overallControls.selectAll("button")

    input.on("keyup", () => {
      var el = d3.event.currentTarget
      this.searchByTerm(el.value)
    })

    buttons.on("click", () => {
      this.updateViewStrategy(d3.event.currentTarget.getAttribute("data-cluster-key"))
    })

  },
  updateViewStrategy: function(strategy){
    if (this.clusterKey !== strategy){
      this.clusterKey = strategy
      if (strategy === "industry"){
        this.transitionToIndustry()
      } else if(strategy === "all"){
        this.transitionToOverall()
      }
    }
  },
  endAll: function(transition, callback) {
      var n = 0
      transition
          .each(function() { ++n })
          .each("end", function() { if (!--n) callback.apply(this, arguments) })
  },
  transitionToIndustry: function(){
    var ease = "quad-in-out",
        duration = 1000

    this.overallControls.selectAll("button")
      .classed({
        "active": function(d){
          return this.getAttribute("data-cluster-key") === "industry"
        }
      })

    this.svg.attr("height", this.yOffset)

    this.root.classed({
      "industry-view": true
    })

    this.graphContents.transition()
      .ease(ease)
      .duration(duration)
      .styleTween("transform", (d, i, a) => {
        var self = this
        return function(t){
          return `translate(0,${Math.round(self.overallViewHeight - self.margins.top) * -t}px)`
        }
      })

    this.bubbleGroups.transition()
      .ease(ease)
      .duration(duration)
      .attrTween("transform", (d, i, a) => {
        var cluster = d.clusters[this.clusterKey]
        return function(t){
          var xDiff = cluster.x - d.x,
              yDiff = cluster.y - d.y
          return `translate(${d.x + xDiff*t},${d.y + yDiff*t})`
        }
      })
      .call(this.endAll, () => {
        this.positionAroundCluster(this.dataset)
        this.forceTemperature = 0.1
        this.forceLayout.start()
      })
  },
  transitionToOverall: function(){
    var ease = "quad-in-out",
        duration = 1000

    this.clearFilters()

    this.overallControls.selectAll("button")
      .classed({
        "active": function(d){
          return this.getAttribute("data-cluster-key") === "all"
        }
      })

    this.graphContents.transition()
      .ease(ease)
      .duration(duration)
      .styleTween("transform", (d, i, a) => {
        var self = this
        return function(t){
          var i = 1-t
          return `translate(0,${Math.round(self.overallViewHeight - self.margins.top) * -i}px)`
        }
      })

    this.bubbleGroups.transition()
      .ease(ease)
      .duration(duration)
      .attrTween("transform", (d, i, a) => {
        var cluster = d.clusters[this.clusterKey]
        return function(t){
          var xDiff = cluster.x - d.x,
              yDiff = cluster.y - d.y
          return `translate(${d.x + xDiff*t},${d.y + yDiff*t})`
        }
      })
      .call(this.endAll, () => {
        this.root.classed({
          "industry-view": false
        })
        this.svg.attr("height", this.overallViewHeight)
        this.positionAroundCluster(this.dataset)
        this.forceTemperature = 0.5
        this.forceLayout.start()
      })
  },
  searchByTerm: function(term){
    var searchRegex = new RegExp(`${term}`, "gi")
    this.highlightData(
      this.dataset.filter(function(d){
        return d.name.match(searchRegex) || d.industry.match(searchRegex)
      })
    )
  },
  highlightData: function(data){
    this.bubbleGroups
      .classed({
        "inactive": (d) => {
          return !data.includes(d)
        }
      })
    if(data.length === 1){
      let matchingBubbleGroup = this.bubbleGroups.filter((d) => {
        return d === data[0]
      }).node()
      this.showTooltip(data[0], matchingBubbleGroup)
    } else {
      this.hideTooltip()
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
  processSectionsByIndustry: function(dataset){
    var sectionsByIndustry = d3.nest().key((d) => d.industry).entries(dataset),
        standaloneThreshold = Math.floor(sectionsByIndustry.length/2),
        industryGroups

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

    // sort industry cohorts by # of companies they have
    sectionsByIndustry.sort((a,b) => {
      return b.values.length - a.values.length
    })

    // the top half of industries get their own standalone graph in the industry breakdown
    this.singularIndustrySections = sectionsByIndustry.slice(0, standaloneThreshold)
    // the remaining get grouped
    this.singularIndustrySections.push({
      key: "Miscellaneous",
      isHeterogenous: true,
      values: sectionsByIndustry.slice(standaloneThreshold, sectionsByIndustry.length)
        .reduce((a,b) => {
          return a.concat(b.values)
        }, [])
    })

    // store a reference to the singularIndustrySection on each node
    Object.keys(this.singularIndustrySections).forEach((key) => {
      this.singularIndustrySections[key].values.forEach((node) => {
        node.sections.byChartGroup = this.singularIndustrySections[key]
      })
    })

    industryGroups = this.mainGroup.append("g")
      .attr("class", "industries").selectAll("g")
      .data(this.singularIndustrySections)
      .enter()
      .append("g")
        .attr("class", (d) => this.slugify(d.key))
        .call((groups) => {
          var self = this
          this.addAxisToGroup(groups)
          groups.each(function(d){
            self.setupChart(d.values, d3.select(this), d, "industry")
          })
        })

    // industry group headline
    // industryGroups
    //   .append("text")
    //     .text((d) => d.key)
    //     .attr("class", "industry-title")
    //     .attr("x", -this.margins.left)
    //     .attr("dx", 24)
    //     .attr("dy", "-1.5em")

    this.svg.attr("height", this.overallViewHeight)

    return sectionsByIndustry
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

      // draw mean rectangle
      if(parseInt(section.key) === this.overall.mean){
        // do something
      }

    })

    return sectionsByPaid
  },
  processSubsectionsByUnpaid: function(section, subsectionsByUnpaid, yOffset, clusterKey){
    var originalYOffset = yOffset
    subsectionsByUnpaid.forEach((subsection, i) => {
      var radius = this.weeksToRadius(this.reduceTotalWeeks(subsection.values)),
          clusterData = {
            radius: radius,
            x: section.x0 + section.width/2,
            y: yOffset + radius * 1.5
          };

      subsection.values.forEach((node) => {
        node.clusters = (node.clusters || {})
        node.radius = this.weeksToRadius(this.reduceTotalWeeks([node]))
        node.clusters[clusterKey] = clusterData
      })

      yOffset += radius * 3
    })
    return yOffset - originalYOffset
  },
  positionAroundCluster: function(dataset){
    this.nestedStructure("paidLeave").entries(dataset).forEach((section) => {
      this.nestedStructure("unpaidLeave").entries(section.values).reverse().forEach((subsection) => {
        var packingBoxDimensions = [1, 1],
            packLayout = d3.layout.pack()
              .size(packingBoxDimensions)
              .padding(10)
              .value((d) => {
                return d.radius * d.radius
              })
              .nodes({
                children: subsection.values
              })

        subsection.values.forEach((node) => {
          node.x = node.clusters[this.clusterKey].x - packingBoxDimensions[0]/2 + Math.random()
          node.y = node.clusters[this.clusterKey].y - packingBoxDimensions[1]/2 + Math.random()
        })

      })
    })

  },
  slugify: function(s){
    return s.toLowerCase().replace(/[^a-zA-Z\d\s:]/g, "").replace(/\s+/g,"-")
  },
  buildAxis: function(){

    var axisGroup = this.defs.append("g").attr({
      "id": "x-axis",
      "class": "axis x",
      "transform": `translate(0,-10)`
    })

    axisGroup.append("line")
      .attr("class", "line")
      .attr("x1", 0)
      .attr("x2", this.width)

    // axis labels
    var axisLabelsGroup = axisGroup
      .append("g")
      .attr("class", "label-group")
      .attr("transform", `translate(-10,-2)`)

    axisLabelsGroup
      .append("text")
      .attr("class", "heading")
      .attr("dy", "-0.7em")
      .text("Paid leave")

    axisLabelsGroup
      .append("text")
      .attr("class", "heading-unit")
      .text("(weeks)")

    var axisTickGroups = axisGroup.selectAll("g.tick")
      .data(this.sections.byPaid)
      .enter()
      .append("g")
      .attr("class", "tick")
      .attr("transform", (d) => `translate(${d.x0 + d.width/2}, 0)`)

    // tick labels
    axisTickGroups
      .append("text")
      .text((d) => d.key)
      .attr("y", "-0.5em")
      .attr("dy", "0")

    // tick notches
    axisTickGroups
      .append("line")
      .attr("y1", 0)
      .attr("y2", 5)

  },
  addAxisToGroup: function(group){
    group.append("use").attr("xlink:href", "#x-axis")
  },
  showTooltip: function(d, el){
    this.hideTooltip()
    setTimeout(() => {
      isotip.open(el, {
        content: tooltipTemplate(d)
      })
    }, 0)
  },
  hideTooltip: function(){
    isotip.close()
  },
  draw: function(){
    var self = this

    this.buildAxis()
    this.addAxisToGroup(this.mainGroup)

    this.bubbleGroups = this.mainGroup.selectAll("g.bubble-group")
      .data(this.dataset)
      .enter().append("g")
      .attr("transform", (d) => {
        return `translate(${d.x},${d.y})`
      })
      .attr("class", (d) => {
        var classes = ["bubble-group", this.slugify(d.industry)]
        if(d.subclassification){
          classes.push(this.slugify(d.subclassification))
        }
        return classes.join(" ")
      })
      .on("mouseover", (d) => {
        this.showTooltip(d, d3.event.currentTarget)
      })
      .on("mouseout", (d) => {
        this.hideTooltip()
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
      .on("tick", this.onTick.bind(this))
      .start()
  },
  getSecondaryKey: function(d, isHeterogenous){
    if(isHeterogenous){
      let pieces = [d.industry]
      if(d.subclassification){
        pieces.push(d.subclassification)
      }
      return pieces.join(": ")
    } else {
      return d.subclassification
    }
  },
  setupChart: function(dataset, groupElement, chartGroup, clusterKey="all"){
    var sections = this.nestedStructure("paidLeave").entries(dataset),
        yOffset = this.yOffset || 0

    this.yOffset = yOffset

    if(groupElement){
      groupElement.attr("transform", `translate(0,${this.yOffset})`)
    }

    var industryChartHeader = this.graphContents.append("div")
      .attr("class", (d) => {
        var classes = ["industry-chart-header"]
        if(chartGroup && chartGroup.key){
          classes.push(this.slugify(chartGroup.key))
        }
        return classes.join(" ")
      })
      .style("top", `${Math.round(this.yOffset)}px`)

    // this should only happen for the first call
    if(clusterKey === "all"){
      this.sections = (this.sections || {})
      this.sections.byPaid = this.processSectionsByPaid(sections)
    } else {
      industryChartHeader.append("h2")
        .attr("class", "industry-title")
        .text(chartGroup.key)

      chartGroup.filterLabels = industryChartHeader
        .append("div")
        .attr("class", "industry-filters")
        .selectAll("a")
          .data(
            d3.nest()
              .key((d) => {
                return this.getSecondaryKey(d, chartGroup.isHeterogenous)
              })
              .entries(dataset)
              .filter((subsection) => {
                // remove subsections if its name is an empty or it only has one node
                return subsection.key && subsection.values.length > 1
              })
              .sort((a,b) => {
                return b.values.length - a.values.length
              })
          )
          .enter()
          .append("a")
            .attr("class", "filter-link")
            .text((d) => d.key)
            .attr("data-industry", chartGroup.key)
            .attr("data-subclassification", (d) => d.key)
            .on("click", (d, i) => {
              var e = d3.event,
                  el = d3.select(e.target)

              this.toggleFilter([
                el.attr("data-industry"),
                el.attr("data-subclassification")
              ])

            })
    }

    // begin building out the clusters for each section
    var sectionHeights = sections.map((section) => {
      var paidSection = section,
          extraVerticalSpacing = this.margins.bottom + this.sectorMargins.top

      if(chartGroup && chartGroup.key === "Miscellaneous"){
        extraVerticalSpacing += 60
      }

      // if we already have established paid sections,
      // then find the corresponding paid section
      if(clusterKey !== "all"){
        paidSection = this.sections.byPaid.find((item) => {
          return section.key === item.key
        })
      }

      return this.processSubsectionsByUnpaid(
        paidSection,
        this.nestedStructure("unpaidLeave").entries(section.values).reverse(),
        yOffset,
        clusterKey
      ) + extraVerticalSpacing
    })

    this.overallViewHeight = (this.overallViewHeight || d3.max(sectionHeights))

    this.yOffset += d3.max(sectionHeights)
  },
  toggleFilter: function(filterPair){
    var filterGroup
    this.filters = (this.filters || {})
    filterGroup = this.filters[filterPair[0]]
    if (filterGroup && filterGroup.includes(filterPair[1])){
      this.removeFilter(filterPair)
    } else {
      this.addFilter(filterPair)
    }
  },
  clearFilters: function(){
    if(this.filters){
      Object.keys(this.filters).forEach((key) => {
        this.filters[key] = []
      })
      this.filterChanged()
    }
  },
  addFilter: function(filterPair){
    var filterGroup
    this.filters = (this.filters || {})
    this.filters[filterPair[0]] = (this.filters[filterPair[0]] || [])
    this.filters[filterPair[0]].push(filterPair[1])
    this.filterChanged()
  },
  removeFilter: function(filterPair){
    var filterGroup
    this.filters = (this.filters || {})
    this.filters[filterPair[0]] = (this.filters[filterPair[0]] || [])
    this.filters[filterPair[0]] = this.filters[filterPair[0]].filter((filterValue) => filterValue !== filterPair[1])
    this.filterChanged()
  },
  filterChanged: function(){
    Object.keys(this.filters).forEach((key) => {
      var matchingIndustrySection = this.singularIndustrySections.find((section) => section.key === key)

      // toggle "active" class to labels
      matchingIndustrySection.filterLabels
        .classed({
          "active": (d) => {
            return this.filters[key].includes(d.key)
          }
        })

      // toggle "inactive" class in bubble groups

      this.bubbleGroups
        // filter out nodes that are not in chartGroup
        .filter((d) => {
          return d.sections.byChartGroup.key === matchingIndustrySection.key
        })
        .classed({
          "inactive": (d) => {
            return this.filters[key].length && !this.filters[key].includes(this.getSecondaryKey(d, matchingIndustrySection.isHeterogenous))
          }
        })
    })
  },
  processData: function(){
    this.overall = {
      mean: d3.mean(this.dataset, this.xAccessor),
      median: d3.median(this.dataset, this.xAccessor)
    }

    this.scale = {
      color: d3.scale.linear()
          .domain( d3.extent(this.dataset.map(this.xAccessor)) )
          .range(["#6FC6F7", "#27CC22"])
          .interpolate(d3.interpolateLab)
    }

    this.setupChart(this.dataset)
    this.processSectionsByIndustry(this.dataset)
    this.positionAroundCluster(this.dataset)

    // setTimeout(() => {
    //   this.clusterKey = "industry"
    //   this.positionAroundCluster(this.dataset)
    //   this.forceLayout.start()
    // }, 5000)
  },
  onTick: function(e) {
    if(e.alpha < 0.07){
      this.forceLayout.stop()
    } else {
      this.bubbleGroups
        // .each(this.moveTowardCluster.call(this, e.alpha))
        // .each(this.cluster.call(this, e.alpha))
        .each(this.collide.call(this, this.forceTemperature))
        .attr("transform", (d) => {
          return `translate(${d.x},${d.y})`
        })
        // .each(this.bounceBack(e.alpha))
    }
  },
  moveTowardCluster: function(alpha){
    var damper = 0.202
    return (d) => {
      d.x = d.x + (d.clusters[this.clusterKey].x - d.x) * damper * alpha
      d.y = d.y + (d.clusters[this.clusterKey].y - d.y) * damper * alpha
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
      var cluster = d.clusters[this.clusterKey];
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
    var padding = 0, // separation between nodes within cluster
        clusterPadding = 10, // separation between clusters
        maxRadius = this.weeksToRadius(52)

    var quadtree = d3.geom.quadtree(this.dataset)
    return (d) => {
      var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r

      quadtree.visit((quad, x1, y1, x2, y2) => {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius + (d.clusters[this.clusterKey] === quad.point.clusters[this.clusterKey] ? padding : clusterPadding)

          if (l < r) {
            l = (l - r) / l * alpha
            d.x -= x *= l
            d.y -= y *= l
            quad.point.x += x
            quad.point.y += y
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1
      })
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
