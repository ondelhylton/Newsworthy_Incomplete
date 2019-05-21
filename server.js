var cheerio = require("cheerio");
var axios = require("axios");

var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var PORT = 3000;
var db = require("./models");
var app = express();
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
mongoose.connect("mongodb://localhost/TRDarticles", { useNewUrlParser: true });


app.get("/articles", function(req, res) {
axios.get("https://therealdeal.com/").then(function(response) {
  const $ = cheerio.load(response.data);


  let resultTitle = [];
  let resultLink = [];
  let resultDate = [];
  let resultImage =[];
  let resultSummary =[];
  var result = {};


//Image
  $(".blogroll_image_small").each(function(i, element) {

    var imgLink = $(element).find("a").find("img").attr("src");
    resultImage.push({ image: imgLink });
  })


//Date
  $("span.date.updated.published").each(function(i, element) {
    var date = $(element).text();
    resultDate.push({
        date:date,
      });
    });

//Summary
    $(".blogroll_excerpt").each(function(i, element) {
        let summary = $(element).text().slice(14, -12);
        // .split("\t\t\t\t\t\t\t\t\t\t\t\t")[0];
        resultSummary.push({
            summary: summary,
          });
        });

//Title
  $("h3.entry-title.entry-summary").each(function(i, element) {
    var title = $(element).children().attr("title");
    resultTitle.push({
      title: title,
    });
  });

//Link
  $("h3.entry-title.entry-summary").each(function(i, element) {
    var link = $(element).children().attr("href");
    resultLink.push({
      link: link,
    });
  });


//   console.log(resultTitle, resultDate, resultImage, resultSummary, resultLink );

  result.title = resultTitle
  result.date = resultDate
  result.image = resultImage
  result.link = resultLink
  result.summary = resultSummary


  db.Article.create(result)
  .then(function(dbArticle) {
    console.log(dbArticle);
  })
  .catch(function(err) {

    console.log(err);
  });
  
});
})




// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});









