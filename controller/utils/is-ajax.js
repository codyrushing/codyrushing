module.exports = function(){
    var requestedWithHeader = this.request && this.request.header && this.request.header.hasOwnProperty("x-requested-with")
        ? this.request.header['x-requested-with']
        : null;

    return requestedWithHeader && requestedWithHeader.toLowerCase() === "xmlhttprequest";
};
