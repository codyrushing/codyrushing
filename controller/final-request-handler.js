var _ = require("lodash"),
    constants = require("../constants");

module.exports = function *(next){
    var requestedWithHeader = this.request && this.request.header && this.request.header.hasOwnProperty("x-requested-with")
        ? this.request.header['x-requested-with']
        : null;

    if(requestedWithHeader && requestedWithHeader.toLowerCase() === "xmlhttprequest"){
        // ajax
        this.response.body = JSON.stringify(this.state.pageData);
    } else {
        // traditional page load

        // only traditional page load needs page data
        yield require("../apod").apply(this, arguments);

        // site wide globals
        this.state.pageData = _.assign(this.state.pageData, {
            SITE_NAME: constants.SITE_NAME,
            SITE_DESCRIPTION: constants.SITE_DESCRIPTION,
            NODE_ENV: this.app.env
        });

        if(this.state.pageData && this.state.pageData.isSingle){
            yield this.render("post", this.state.pageData);
        } else {
            yield this.render("list", this.state.pageData);
        }
    }

};
