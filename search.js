"use strict"
var searchIndex = require("search-index"),
    Post = require("./models/post");

module.exports = new Promise(function(resolve, reject){
  Post.getAll().then(function(posts){
    let postsData = posts.map(post => post.getFullJSON())
    
    searchIndex(options, (err,si)=>{
      if(err) {
        console.error(err)
        reject(err)
      } else {
        si.add(postsData, {}, (err)=>{
          // add stuff to index
          if (err) {
            reject(err)
          } else {
            console.log("added all posts")
            resolve(si)
          }
        })
      }
    })
  })
})
