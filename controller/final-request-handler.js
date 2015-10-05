module.exports = function *(next){

    var requestedWithHeader = this.request && this.request.header && this.request.header.hasOwnProperty("x-requested-with")
        ? this.request.header['x-requested-with']
        : null;

    if(requestedWithHeader && requestedWithHeader.toLowerCase() === "xmlhttprequest"){
        // ajax
        this.response.body = JSON.stringify(this.state.pageData);
    } else {
        // traditional page load
        console.log(this.state.pageData);
        if(this.state.pageData && this.state.pageData.isSingle){
            yield this.render("post", this.state.pageData);
        } else {
            yield this.render("list", this.state.pageData);
        }
    }

    yield next;
};
