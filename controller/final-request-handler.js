var _ = require("lodash"),
    isAjax = require("./utils/is-ajax"),
    constants = require("../constants");

module.exports = function *(next){
    if(isAjax()){
        // ajax
        this.response.body = this.state.pageData;
    } else if (this.state.pageData) {
        // traditional page load

        // only traditional page load needs APOD data
        // yield require("../apod").apply(this, arguments);

        // site-wide globals
        this.state.pageData = _.assign(this.state.pageData, {
            SITE_NAME: constants.SITE_NAME,
            SITE_DESCRIPTION: constants.SITE_DESCRIPTION,
            NODE_ENV: this.app.env,
            apod: this.app.apodData
        });

        // render list or single post view
        if(this.state.pageData.template){
            yield this.render(this.state.pageData.template, this.state.pageData);
        }
        yield next;
    }

};
