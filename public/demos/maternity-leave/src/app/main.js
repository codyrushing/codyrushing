"use strict"
import Handlebars from "handlebars/dist/handlebars.runtime"

import visualizer from "./components/visualizer"
import registerHelpers from "./handlebars-helpers"

// register handlebars helpers
registerHelpers(Handlebars)

window.addEventListener("DOMContentLoaded", function(e){
  Object.create(visualizer).init({
    url: "data.csv",
    element: document.querySelectorAll(".container")[0]
  })
})
