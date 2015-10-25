var app = app || {};
if(!app.base){ app.base = {}; }

app.base.router = Backbone.Router.extend({
	routes: {
		"": "home"
	},
	initialize: function(){

	},
	home: function(){
		console.log("home");
	}
});
