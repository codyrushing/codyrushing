jQuery.noConflict();
(function(app, $){

	var buildGistIt = function(container){
		var fileContent = container.find("pre.prettyprint"),
    		meta = container.find(".gist-meta");
    	if(fileContent.length){
			$("code.gist-it").each(function(i, el){
				el = $(el);
				if(!el.data("gist-it-loaded")){
					el.parent().before( $("<div class=\"gist-it-meta\">").html( meta.html() ) );
					el.html( fileContent.html() );
					el.data("gist-it-loaded", true);
					Prism.highlightAll();
				}
			});
    	}
	};

	// rewrite document.write so that gist-it will work async
    document.write = function (s) {
    	try {
	    	buildGistIt($(s));
    	} catch(e){
    		// document.write broke
    	}
    }

    buildGistIt($("#main"));

	Array.prototype.append = function(s){
		this.push(s);
		return this;
	};

	var animation = (function(){
		if(window.document.documentElement.style.webkitAnimation !== undefined){
			return {
				animationEndEvent: "webkitAnimationEnd",
				animationStartEvent: "webkitAnimationStart"
			};
		}
		if(window.document.documentElement.style.MozAnimation !== undefined){
			return {
				animationEndEvent: "mozAnimationEnd animationend",
				animationStartEvent: "mozAnimationStart animationstart"
			};
		}
		if(window.document.documentElement.style.msAnimation !== undefined){
			return {
				animationEndEvent: "msAnimationEnd",
				animationStartEvent: "msAnimationStart"
			};
		}
		if(window.document.documentElement.style.animation !== undefined){
			return {
				animationEndEvent: "animationend",
				animationStartEvent: "animationstart"
			};
		}
	})();

	_.assign(app, {
		supportsAnimation: animation.animationEndEvent && animation.animationStartEvent,
		buildBase: function(){
			var me = this,
				body = $("body"),
				base = {};

			// extend model
			_.assign(Backbone.Model.prototype, {
				initialize: function(){
					_.bindAll(this);
				},
				on_sync: function(model, resp, options){

				}
			});

			// extend views
			_.assign(Backbone.View.prototype, {
				initialize: function(){
					var outClasses = ["out"];
					if(me.reverse){
						outClasses.push("reverse");
					}
					_.bindAll(this);
					this.$el.removeClass("in reverse").addClass(outClasses.join(" "));
					//this.beginTransition();
					this.$el.on(animation.animationStartEvent, this.on_animationStart);
					this.$el.on(animation.animationEndEvent, this.on_animationEnd);
					this.model.once("sync", this.prerender);
				},
				loadingTemplate: app.templates["views/loading.hbs"],
				titleTemplate: app.templates["views/title.hbs"],
				on_animationStart: function(e){
					this.animating = true;
					$("body").addClass("animating");
				},
				on_animationEnd: function(e){
					this.animating = false;
					this.$el.removeClass("in");
				},
				beginTransition: function(){
					$("body").addClass("animating");
				},
				endTransition: function(){
					$("body").removeClass("animating");
					this.$el.removeClass();
				},
				prerender: function(){
					// do some logic here to make sure you are not still in the middle of an animation
					if(this.animating){
						this.$el.one(animation.animationEndEvent, this.render);
					} else {
						this.render();
					}
				},
				insert: function(classes, html){
					var container = this.el;
					if(app.supportsAnimation){
						this.$el.one(animation.animationEndEvent, this.endTransition);
					} else {
						this.endTransition();
					}

					this.$el.html(html).addClass(classes.join(" ")).removeClass("out");

					this.hideLoading();

					Prism.highlightAll();
					document.title = this.titleTemplate(me.titles);
					me.reverse = false;

					this.$el.find("pre[data-src]").each(function(i, el){

					});
				},
				showLoading: function(){
					if(!$("#loading").length){
						$("body").append(this.loadingTemplate());
					}
				},
				hideLoading: function(){
					$("#loading").remove();
				},
				close: function(){
					// TODO maybe?
				}

			});

			// extend models
			_.assign(Backbone.Model.prototype, {
				clearPaginationValues: function(){
					this.unset("heading");
					this.unset("older_posts_url");
					this.unset("newer_posts_url");
					this.unset("previous_post");
					this.unset("next_post");
				}
			});

			base.models = {
				Post: Backbone.Model.extend({

				}),
				PostList: Backbone.Model.extend({

				})
			};

			base.views = {
				Single: Backbone.View.extend({
					el: "#main",
					template: app.templates["views/post.hbs"],
					render: function(){
						var out = this.template(this.model.attributes),
							inClasses = ["in"];
						if(me.reverse){
							inClasses.push("reverse");
						}
						me.addToTitle(this.model.attributes.post.title);
						me.addSiteNameTitle();
						body.addClass("single").removeClass("list");

						this.insert(inClasses, out);
						app.loadComments();
					}
				}),
				List: Backbone.View.extend({
					el: "#main",
					template: app.templates["views/list.hbs"],
					render: function(){
						var out = this.template(this.model.attributes);
							inClasses = ["in"];
						if(me.reverse){
							inClasses.push("reverse");
						}
						body.addClass("list").removeClass("single");

						this.insert(inClasses, out);
					}
				})
			};

			base.router = Backbone.Router.extend({
				routes: {
					"": "home",
					"tag/:tag(/)": "tag",
					"tag/:tag/page/:page(/)": "tag",
					"search/:term(/)": "search",
					"search/:term/page/:number(/)": "search",
					"page/:page(/)": "pageList",
					":post(/)": "post"
				},
				initialize: function(){
					_.bindAll(this);
					this.postModel = new base.models.Post();
					this.listModel = new base.models.PostList();
					this.on("route", this.trackPageView);
					this.on("navigate:before", this.on_beforeNavigate);
				},
				on_beforeNavigate: function(params){
					if(params.reverse){
						me.reverse = true;
					}
					me.titles = [];
					this.listModel.clearPaginationValues();
					this.postModel.clearPaginationValues();
				},
				trackPageView: function(){
			        var url = Backbone.history.getFragment();

			        //prepend slash
			        if (!/^\//.test(url) && url !== ""){
			            url = "/" + url;
			        }
					if(typeof ga === "function"){
				        ga("send", "pageview", url);
			        }
				},
				getJsonUrl: function(){
					var r = "/" + Backbone.history.fragment + "?json=1&date_format=M j, Y";
					return r.replace(/^\/\//, "/");
				},
				home: function(page){
					me.addSiteNameTitle();
					me.addDescriptionTitle();
					this.list(page);
				},
				tag: function(tag, page){
					// do something with tag here
					me.titles.append(tag);
					me.addPageNumberTitle(page);
					me.addSiteNameTitle();

					this.listModel.set("heading", {
						type: "tag",
						term: tag
					});

					this.list(page);
				},
				search: function(term, page){
					// do something with search term here
					me.titles.append(term);
					me.titles.append("Search results");
					me.addPageNumberTitle(page);
					me.addSiteNameTitle();

					this.listModel.set("heading", {
						type: "search",
						term: term
					});

					this.list(page);
				},
				pageList: function(page){
					me.addPageNumberTitle(page);
					this.home(page);
				},
				post: function(post){
					this.postView = new base.views.Single({
						model: this.postModel
					});
					this.postModel.urlRoot = this.getJsonUrl();
					this.postView.showLoading();
					this.postModel.fetch({
						error: function(model, resp, options){
							window.location = post;
						}
					});
					this.postModel.once("sync", this.postModel.on_sync);
				},
				list: function(pageSlug){
					this.listView = new base.views.List({
						model: this.listModel
					});
					this.listView.showLoading();
					this.listModel.urlRoot = this.getJsonUrl();

					this.listModel.fetch({
						err: function(model, resp, options){
							window.location = post;
						}
					});

					this.listModel.once("sync", this.listModel.on_sync);
				}
			});

			return base;

		},
		init: function(){
			this.base = this.buildBase();
			this.initRouter();
			$(this.domReady.bind(this));
		},
		titles: [],
		siteName: "Cody Rushing",
		siteDescription: "Maker of things and internet",
		addDescriptionTitle: function(){
			if(!this.titles){ this.titles = []; }
			this.titles.append(this.siteDescription);
		},
		addSiteNameTitle: function(){
			if(!this.titles){ this.titles = []; }
			this.titles.append(this.siteName);
		},
		addPageNumberTitle: function(page){
			if(!this.titles){ this.titles = []; }
			if(page){ this.titles.append("Page " + page); }
		},
		addToTitle: function(title){
			if(!this.titles){ this.titles = []; }
			this.titles.append(title);
		},
		domReady: function(){
			this.bindEvents($(document));
			Backbone.history.start({
				pushState: true,
				hashChange: false,
				silent: true
			});
		},
		gapiLoaded: function(){
			this.loadComments();
		},
		loadComments: function(){
			if($("body").hasClass("single")){
				gapi.comments.render("comments", {
				    href: window.location,
				    width: parseInt($("#main").width(), 10),
					first_party_property: "BLOGGER",
				    view_type: "FILTERED_POSTMOD"
				});
			}
		},
		initRouter: function(){
			this.router = new this.base.router();
		},
		appNavigate: function(route, reverse){
			this.router.trigger("navigate:before", {
				route: route,
				reverse: reverse
			});
			this.router.navigate(route, { trigger: true });
		},
		bindEvents: function(root){
			var fullHost = window.location.protocol + "//" + window.location.hostname,
				body = $("body");
			root.on("click", "a[href^='/'], a[href^='"+fullHost+"']", function(e) {
				if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
					var hostRe = new RegExp("^"+fullHost),
						link = $(e.currentTarget),
						route = link.attr("href")
							.replace(hostRe, "")
							.replace(/^\//, "");
					this.appNavigate(route, link.attr("role") === "back");
					e.preventDefault();
				}
			}.bind(this));

			$(".search-form", root).on("submit", function(e){
				var searchTerm = $("input[type=\"search\"]", e.currentTarget).val();
				searchTerm = escape(searchTerm.replace(/ /g, "+"));
				this.appNavigate("search/"+searchTerm);
				e.preventDefault();
			}.bind(this));

			$(window).on("popstate", function(e){
				this.titles = [];
				this.reverse = true;
				this.router.listModel.clearPaginationValues();
				this.router.postModel.clearPaginationValues();
			}.bind(this));

		}
	});

	if(window.history && window.history.pushState){
		app.init();
	}

	// expose global
	window.cr = app;

	// init google+ comments
    var po = document.createElement("script");
    po.type = "text/javascript"; po.async = true;
    po.src = "https://apis.google.com/js/plusone.js";
    po.setAttribute("parsetags", "explicit");
    $(po).on("load", $.proxy(app.gapiLoaded, app));
    document.getElementsByTagName("head")[0].appendChild(po);

})(typeof cr !== "undefined" ? cr : {}, jQuery);
