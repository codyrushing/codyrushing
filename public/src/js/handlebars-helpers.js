var helpers = {
	ifCond: function(v1, operator, v2, options){
		switch (operator) {
			case '==':
				return (v1 == v2) ? options.fn(this) : options.inverse(this);
			case '===':
				return (v1 === v2) ? options.fn(this) : options.inverse(this);
			case '<':
				return (v1 < v2) ? options.fn(this) : options.inverse(this);
			case '<=':
				return (v1 <= v2) ? options.fn(this) : options.inverse(this);
			case '>':
				return (v1 > v2) ? options.fn(this) : options.inverse(this);
			case '>=':
				return (v1 >= v2) ? options.fn(this) : options.inverse(this);
			case '&&':
				return (v1 && v2) ? options.fn(this) : options.inverse(this);
			case '||':
				return (v1 || v2) ? options.fn(this) : options.inverse(this);
			default:
				return options.inverse(this);
		}
	},
	eachDelimited: function(context, delimiter, options){
		var r = [];
		for(var i=0, j=context.length; i<j; i++) {
			r.push(options.fn(context[i]));
			if(i<j-1){
				r.push(delimiter);
			}
		}
		return r.join("");
	}
};

module.exports = function(hbs){
	for(var prop in helpers){
		if(typeof helpers[prop] === "function"){
			hbs.registerHelper(prop, helpers[prop]);
		}
	}
};
