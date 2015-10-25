var $ = require("domtastic"),
    loadExternalCode = require("app/load-external-code");

module.exports = function($root){
    $("code[data-src]", $root).each(loadExternalCode);
}
