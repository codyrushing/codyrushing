
var donutChart = (function() {
    "use strict";

    var extend = function(base, incoming){
        for(var prop in incoming){
            base[prop] = incoming[prop];
        }
    };

    var _donutChart = function(params) {
        var defaults = {
            ease: "quad-in-out",
            useTransition: true,
            width: 100,
            height: 100,
            origin: 0,
            padding: 0,
            destination: 360,
            thickness: 10,
            transitionDelay: 500,
            tweenThickness: true,
            tweenAngle: true,
            transitionDuration: 1000,
            transitionComplete: function(){}
        };

        extend(defaults, params);
        extend(this, defaults);

        this.data = this.convertData(this.data);

        this.build();

        return this;
    };

    _donutChart.prototype = {
        build: function() {
            var self = this,
                remainder = this.remainder;

            this.outerWidth = this.width + this.padding*2;
            this.outerHeight = this.height + this.padding*2;

            // base arc
            this.baseArc = d3.svg.arc()
                .outerRadius(function(d){
                    return d.outerRadius || self.width / 2;
                })
                .innerRadius(function(d) {
                    return d.innerRadius || self.width / 2;
                })
                .startAngle(function(d, i){
                    return d.startAngle || self.degreesToRadians(self.origin);
                })
                .endAngle(function(d, i) {
                    return d.endAngle || self.degreesToRadians(self.origin);
                });

            if(!this.useTransition){
                this.baseArc
                    .innerRadius(function(d){
                        return d.innerRadius || self.width / 2 - self.thickness;
                    });
            }

            this.chartWrap = d3.select(this.container).append("div")
                .attr("class", "chart-wrap")
                .attr("id", this.id || null);

            this.chartSVG = this.chartWrap
                .append("svg:svg")
                .attr("width", this.outerWidth)
                .attr("height", this.outerHeight);

            // create background group and append single arc to it
            this.backgroundGroup = this.chartSVG
                .append("svg:g")
                .attr("transform", "translate(" + parseInt(this.width / 2 + this.padding) + "," + parseInt(this.height / 2 + this.padding) + ")");

            this.backgroundArc = this.backgroundGroup
                .append("svg:path")
                .datum({
                    startAngle: this.degreesToRadians(this.origin),
                    endAngle: this.degreesToRadians(this.destination),
                })
                .style("fill", this.bgColor || "#ebeff6")
                .attr("d", this.baseArc);

            // create a group for the meaningful data points
            this.dataGroup = this.chartSVG
                .append("svg:g")
                .attr("transform", "translate(" + parseInt(this.width / 2 + this.padding) + "," + parseInt(this.height / 2 + this.padding) + ")");

            this.slices = this.dataGroup
                .selectAll("path")
                .data(this.data)
                .enter()
                .append("svg:g")
                .attr("class", "slice");

            this.arcs = this.slices
                .append("svg:path")
                .style("fill", function(d, i) {
                    return d.color;
                })
                .attr("d", this.baseArc);

            if (this.buildComplete && typeof this.buildComplete === "function") {
                this.buildComplete.call(this);
            }

            this.applyTransition();
        },
        globalTransition: function(f) {
            var self = this;

            if(this.useTransition){
                this.chartWrap.transition().delay(this.transitionDelay).duration(this.transitionDuration).ease(this.ease)
                    .each(f)
                    // this chains another transition to the main transition, but is really just used as a callback
                    .transition()
                    .each("start", function(){
                        self.transitionComplete.call(self);
                    });
            }
        },
        applyTransition: function() {
            var self = this;
            this.globalTransition(function() {

                var originAngle = self.degreesToRadians(self.origin),
                    radiusInterpolate = d3.interpolate(self.tweenThickness ? 0 : self.thickness, self.thickness);

                // progress arc, both endAngle and thickness
                self.arcs.transition().attrTween("d", function(d) {
                    var iStart = d3.interpolate(self.tweenAngle ? originAngle : d.startAngle, d.startAngle),
                        iEnd = d3.interpolate(self.tweenAngle ? originAngle : d.endAngle, d.endAngle);
                    return function(t) {
                        d.startAngle = iStart(t);
                        d.endAngle = iEnd(t);
                        d.innerRadius = self.width / 2 - radiusInterpolate(t);
                        return self.baseArc(d);
                    };
                });

                // background arc thickness only
                self.backgroundArc.transition().attrTween("d", function(d) {
                    return function(t) {
                        d.innerRadius = self.width / 2 - radiusInterpolate(t);
                        return self.baseArc(d);
                    };
                });

            });
        },
        degreesToRadians: function(degrees) {
            return degrees * Math.PI / 180;
        },
        convertData: function(data) {
            var startAngle = this.degreesToRadians(this.origin),
                endAngle,
                remainder = data.total,
                item, lastItem, val, prop,
                r = [];

            for (var i = 0; i < data.values.length; i++) {
                val = data.values[i];
                endAngle = startAngle + this.degreesToRadians(val.n / data.total * (this.destination - this.origin));
                item = {
                    startAngle: startAngle,
                    endAngle: endAngle,
                    percent: Math.round(val.n / data.total),
                };
                // merge any other data
                for(prop in val){
                    if(!item.hasOwnProperty(prop)){
                        item[prop] = val[prop];
                    }
                }
                startAngle = endAngle;
                remainder -= val.n;
                r.push(item);
            }

            this.total = data.total;
            this.remainder = remainder;

            return r;
        }

    };

    return _donutChart;

})();
