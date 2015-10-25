module.exports = function(){
    this.animation = (function(){
        if(window.document.documentElement.style.animation !== undefined){
			return {
				animationEndEvent: "animationend",
				animationStartEvent: "animationstart"
			};
		}
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
	})();

    this.supports = {
        history: (function(){
            return window.history && typeof window.history.pushState === "function";
        })(),
        animation: this.animation.animationEndEvent && this.animation.animationStartEvent,
    };
};
