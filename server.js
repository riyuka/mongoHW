var express = require('express');
var app = express();
var mongojs = require('mongojs');

app.use(express.static("public"));

app.set('view engine', 'ejs');
app.set('views','./views');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var cheerio = require("cheerio");
var request = require("request");

var databaseUrl = "infoq_news";
var collections = ["development"];

var db = mongojs(databaseUrl, collections);

request("https://www.infoq.com/development/articles/", function(error, response, html) {

  var $ = cheerio.load(html);
  var results = [];

  $(".news_type1").each(function(i, element) {

    var title = $(element).find("h2").children().attr("title");
    var timeall =  $(element).children(".author").text();
    var time = timeall.trim().slice(-12);
    var content = $(element).find("p:nth-child(4)").text();
    var contentTrim = content.trim();
    var link = $(element).find("h2").children().attr("href");
    var completeLink = "https://www.infoq.com" + link;

    results.push({
      title: title,
      time: time,
      content: contentTrim,
      link: completeLink
    });
  });
  
  $(".news_type2").each(function(i, element) {

    var title = $(element).find("h2").children().attr("title");
    var timeall =  $(element).children(".author").text();
    var time = timeall.trim().slice(-12);
    var content = $(element).find("div.txt p:first-child").clone().children().remove().end().text();
    var contentTrim = content.trim();
    var link = $(element).find("h2").children().attr("href");
    var completeLink = "https://www.infoq.com" + link;
  
    results.push({
      title: title,
      time: time,
      content: contentTrim,
      link: completeLink
    });
  });
  //console.log(results);

  db.on("error", function(error) {
    console.log("Database Error:", error);
  });

  app.post("/newsjson", function(req, res) {
  
      db.development.insert( 
      results,
      function(err, data) {
      if (err) {
        console.log(err);
      }
      else {
        res.redirect('/');
      }
    });
  });
  
  //rendering homepage
  app.get('/', function(req, res, next){
    res.render('../views/pages/index');
  });
  
  //get all data
  app.get('/content/news', function(req, res){
    db.development.find({}, function(err, data) {
      if (err) {
        console.log(err);
      }
      else {
        res.send(data);
      }
    });
  });
  
  //get the one that user wants to comment/see comments
  app.get('/content/:title', function(req, res){
    db.development.find({title: req.params.title},function (error, results, fields) {
      if (error) throw error;
        //console.log(results[0]);
        
        res.render('../views/pages/news', {
          title: results[0].title,
          time: results[0].time,
          content: results[0].content,
          link: results[0].link
        })
      })
   })

  //pull all the comments of this post news
  app.get('/news/comment/:title', function(req, res){
    thistitle = req.params.title;
    console.log(thistitle)
    db.comment.aggregate([{$match: {title: thistitle}}],function (error, results, fields) {
        if (error) throw error;
        //console.log(results);
        res.render('../views/pages/news-comment',
          {
            results
          });
    })
  })
  
  //add comment to this post news
  app.post('/leavecomment/:title', function(req, res){
     //console.log(req.params.title, req.body);
     var commentitle = req.params.title;
     var nickname = req.body.name;
     var comment = req.body.comment;
     var 
      comments = {  title: commentitle,
                    nickname: nickname,
                    comment: comment }
    
     console.log(comments);
  
     db.comment.insert(comments, function(err, data){
      if (err) {
        console.log(err);
      }
      else {
        res.redirect("/");
      }
     });
  })
  
  //delete one comment
  app.get('/deletecomment/:comment', function(req,res){
    var delcomment = req.params.comment;
       console.log(delcomment);
      db.comment.remove({"comment": delcomment},{justOne: true}, function (error, data) {
          if (error) {
              console.log(error);
          } else {
          
          res.redirect("/") };
      });
    });
});

app.listen(3000, function() {
  console.log("App running on port 3000!");
});