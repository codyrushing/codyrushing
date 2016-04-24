var Handlebars = require("handlebars/dist/handlebars.runtime");module.exports = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"item sub\">\n        <span class=\"item-label\">Subclassification:</span> <span class=\"item-value\">"
    + container.escapeExpression((helpers.nullSafe || (depth0 && depth0.nullSafe) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.subclassification : depth0),{"name":"nullSafe","hash":{},"data":data}))
    + "</span>\n      </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"tooltip-content\">\n  <h3>"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</h3>\n  <div class=\"stats\">\n    <div class=\"item\">\n      <span class=\"item-label\">Leave (paid):</span> <span class=\"item-value\">"
    + alias4(((helper = (helper = helpers.paidLeave || (depth0 != null ? depth0.paidLeave : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"paidLeave","hash":{},"data":data}) : helper)))
    + "</span>\n    </div>\n      <div class=\"item sub\">\n        <span class=\"item-label\">Versus overall avg:</span> "
    + alias4((helpers.percentDiff || (depth0 && depth0.percentDiff) || alias2).call(alias1,(depth0 != null ? depth0.diffFromMeanOverall : depth0),{"name":"percentDiff","hash":{},"data":data}))
    + "\n      </div>\n      <div class=\"item sub\">\n        <span class=\"item-label\">Versus industry avg:</span> "
    + alias4((helpers.percentDiff || (depth0 && depth0.percentDiff) || alias2).call(alias1,(depth0 != null ? depth0.diffFromMeanIndustry : depth0),{"name":"percentDiff","hash":{},"data":data}))
    + "\n      </div>\n    <div class=\"item\">\n      <span class=\"item-label\">Leave (unpaid):</span> <span class=\"item-value\">"
    + alias4((helpers.nullSafe || (depth0 && depth0.nullSafe) || alias2).call(alias1,(depth0 != null ? depth0.unpaidLeave : depth0),{"name":"nullSafe","hash":{},"data":data}))
    + "</span>\n    </div>\n    <div class=\"item\">\n      <span class=\"item-label\">Industry:</span> <span class=\"item-value\">"
    + alias4(((helper = (helper = helpers.industry || (depth0 != null ? depth0.industry : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"industry","hash":{},"data":data}) : helper)))
    + "</span>\n    </div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.subclassification : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "  </div>\n</div>\n";
},"useData":true});