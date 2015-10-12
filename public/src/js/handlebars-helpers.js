(function(){
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
		},
		bodyClass: function(context){
			return context.isSingle ? "single" : "list";
		}
	},
	register = function(){
		for(var prop in helpers){
			Handlebars.registerHelper(prop, helpers[prop]);
		}
	};

	if(typeof module !== "undefined" && module.exports){
		module.exports = helpers;
	} else {
		register();
	}

})();
