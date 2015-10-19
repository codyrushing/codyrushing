var _ = require("lodash"),
    constants = require("../../constants");

module.exports = function(posts, page, path){
    var pageNumber = page ? parseInt(page) : 1,
        startingIndex = (pageNumber-1) * constants.POSTS_PER_PAGE,
        endingIndex = startingIndex + constants.POSTS_PER_PAGE,
        pathPieces = _.compact(path.split("/"));

    // take the base url
    // if the penultimate path pieces is "page", then we omit the last two path pieces to get only the relevant path pieces
    var relevantPathPieces = (pathPieces.length > 2 && pathPieces[pathPieces.length-2]) ? pathPieces.slice(0, pathPieces.length-2) : pathPieces;

    var getOlderLink = function(currentPageNumber, basePathPieces, total){
        var r = [],
            hasLink = false,
            totalPages = Math.ceil(total/constants.POSTS_PER_PAGE),
            olderLinkPageNumber = currentPageNumber + 1;

        if(olderLinkPageNumber <= totalPages){
            r = basePathPieces.concat(["page", olderLinkPageNumber]);
            hasLink = true;
        } else if(olderLinkPageNumber === 1) {
            r = basePathPieces;
            hasLink = true;
        }
        return r.length || hasLink ? "/" + r.join("/") : null;
    };

    var getNewerLink = function(currentPageNumber, basePathPieces, total){
        var r = [],
            hasLink = false,
            newerLinkPageNumber = currentPageNumber - 1;

        if(newerLinkPageNumber > 1){
            r = basePathPieces.concat(["page", newerLinkPageNumber]);
            hasLink = true;
        } else if(newerLinkPageNumber === 1) {
            r = basePathPieces;
            hasLink = true;
        }
        return r.length || hasLink ? "/" + r.join("/") : null;
    };

    return {
        posts: _.map(posts.slice(startingIndex, endingIndex), function(post){
            return post ? post.toJSON() : post;
        }),
        template: "list",
        newerLink: getNewerLink(pageNumber, relevantPathPieces, posts.length),
        olderLink: getOlderLink(pageNumber, relevantPathPieces, posts.length)
    };
};
