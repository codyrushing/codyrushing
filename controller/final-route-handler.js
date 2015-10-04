module.exports = function(){
    var requestedWithHeader = this.request && this.request.header && this.request.header.hasOwnProperty("x-requested-with")
        ? this.request.header['x-requested-with']
        : null;

    if(requestedWithHeader && requestedWithHeader.toLowerCase() === "xmlhttprequest"){
        // ajax
        
    } else {
        // traditional page load
    }
};
