require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require("mongoose");
const { Counter, URL} = require("./model/URL");

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

function createURL(req, res){

  const original_url= req.body.url;
  const url = new URL({
    original_url: original_url
  });

  url.save()
  .then((new_url) => {
    console.log("NEW URL", new_url);
    res.json({
      original_url: new_url.original_url,
      short_url: new_url.short_url
    })
  })
  .catch((err) => {
    console.log(err);
  })

}

app.post("/api/shorturl", function(req,res,next){

  const original_url = req.body.url;
  const prefix = /^https?:\/\//i;

  if(prefix.test(original_url)){
    const url_extract = original_url.split("://")[1];
    dns.lookup(url_extract,function(err, addresses, family){
      console.log(err,"--",addresses,"--", family)
      console.log(url_extract);
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
  else{
    res.json({
      error: 'invalid url'
    })
  }
}, createURL)

app.get("/api/shorturl/:short_url",function(req,res){
  const short_url = req.params.short_url;
  URL.findOne({
    short_url: short_url
  }).then((doc)=>{
    res.redirect(doc.original_url);
  });
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
