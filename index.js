require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require("mongoose");
const { Counter, UrlModel} = require("./model/URL");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use("/api/shorturl", bodyParser.urlencoded({ extended: true }))
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true })
.then((_) => {
  console.log("Success")
})
.then((_) => {
  const counter = new Counter({
    _id: "url_counter"
  });
  return counter.save();
})
.then((counter) => {
  console.log("Counter created", counter);
})
.catch((err) =>{
  console.log(err);
});

function validateUrl (err,req,res){
  const code = err.code;
  console.log("Error code", err,code);
  if(code === 11000){
    UrlModel.findOne({
      original_url: req.body.url
    }).then((url) => {
      res.send({
        original_url: url.original_url,
        short_url: url.short_url
      })
    })
  }
  else if(code === 404){
    res.send({
      error: 'invalid url'
    })
  }
}

function createURL(req, res){

  const original_url= req.body.url;
  let url;
  try {
    url = new UrlModel(original_url);
  } catch (error) {
    return res.json({ error: "invalid url" });
  }

  url.save()
  .then((new_url) => {
    console.log("NEW URL", new_url);
    return res.json({
      original_url: new_url.original_url,
      short_url: new_url.short_url
    })
  })
  .catch((err) => {
    console.log(err);
    validateUrl(err, req, res);
  })

}

app.post("/api/shorturl", function(req,res,next){

  const original_url = req.body.url;
  // const prefix = /^https?:\/\//i;

  console.log("Received request for: ", original_url);

  try {
    let url = new URL(original_url);

    dns.lookup(url.hostname,function(err, addresses, family){
      console.log(err,"--",addresses,"--", family)
      console.log(url.hostname);
      if(err){
        res.send({
          error: 'invalid url'
        })
      }
      else{
        next();
      }
    })
  }
  catch (error) {
    return res.json({ error: "invalid url" });
  }
  
}, createURL)

app.get("/api/shorturl/:id?",function(req,res){
  const id = Number(req.params.id);
  console.log("Number", id);
  if(isNaN(id)){
    res.send('Not Found');
  }
  else{
    UrlModel.findOne({
      short_url: id
    }).then((doc)=>{
      if(!doc){
        throw {
          message:"No short URL found for the given input"
        }
      }
      res.redirect(doc.original_url);
    })
    .catch((err) => {
      console.log(err);
      if(err.message === "No short URL found for the given input"){
        res.send({
          error: "No short URL found for the given input"
        })
      }
      else{
        res.send({
          error: 'invalid url'
        })
      }
    });
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
