"use strict"
import visualizer from "./components/visualizer"

window.addEventListener("DOMContentLoaded", function(e){
  Object.create(visualizer).init({
    url: "data.csv",
    element: document.querySelectorAll(".container")[0]
  })
})
