import Handlebars from "handlebars/dist/handlebars.runtime"
import d3 from "d3"

var helpers = {
	ifCond: function(v1, operator, v2, options){
		switch (operator) {
			case '==':
				return (v1 == v2) ? options.fn(this) : options.inverse(this)
			case '===':
				return (v1 === v2) ? options.fn(this) : options.inverse(this)
			case '<':
				return (v1 < v2) ? options.fn(this) : options.inverse(this)
			case '<=':
				return (v1 <= v2) ? options.fn(this) : options.inverse(this)
			case '>':
				return (v1 > v2) ? options.fn(this) : options.inverse(this)
			case '>=':
				return (v1 >= v2) ? options.fn(this) : options.inverse(this)
			case '&&':
				return (v1 && v2) ? options.fn(this) : options.inverse(this)
			case '||':
				return (v1 || v2) ? options.fn(this) : options.inverse(this)
			default:
				return options.inverse(this)
		}
	},
	eachDelimited: function(context, delimiter, options){
		var r = []
		for(var i=0, j=context.length; i<j; i++) {
			r.push(options.fn(context[i]))
			if(i<j-1){
				r.push(delimiter)
			}
		}
		return r.join("")
	},
  nullSafe: function(value, fallback="Unknown"){
    var nullMessage = typeof fallback === "string" ? fallback : "Unknown"
    return value !== null ? value : nullMessage
  },
  formatNumber: function(val){
    if ( !!(val%1) ){
      return d3.format(".3f")(val)
    } else {
      return val
    }
  },
  percentDiff: function(val){
    var valString = d3.format("+,.1%")(val),
        wrapperClass = val >= 0 ? "positive" : "negative"
    return new Handlebars.SafeString(`<span class="item-value ${wrapperClass}">${valString}</span>`)
  }
}

export default function(hbs){
	for(var prop in helpers){
		if(typeof helpers[prop] === "function"){
			hbs.registerHelper(prop, helpers[prop]);
		}
	}
}
