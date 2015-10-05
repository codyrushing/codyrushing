var constants = require("../../constants");

module.exports = function(options){
    var r = [];
    var separator = " | ";
    var isAllPosts = false;

    if(options.postTitle){
        r.push(options.postTitle);
    } else {
        if(options.tag){
            r.push("Posts matching ");
            r.push(options.tag);
        }
        else if(options.query){
            r.push("Results for ");
            r.push(options.query);
        } else {
            isAllPosts = true;
            r.push(constants.SITE_NAME);
            r.push(separator);
            r.push(constants.SITE_DESCRIPTION);
        }

        if(options.page && options.page > 1){
            r.push(separator);
            r.push("Page ");
            r.push(options.page);
        }
    }

    if(!isAllPosts){
        r.push(separator);
        r.push(constants.SITE_NAME);
    }

    return r.join("");
};
