require('dotenv').config();
// const urlRouter = require('./routes/url.controller')
const express = require('express');
const validUrl = require('valid-url')
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectDB } = require('./config/db');
const dns = require('dns');
const urlParser = require('url');
const Url = require('./model/url.model');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

connectDB()

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// app.use("/api/shorturl", urlRouter)
app.post('/api/shorturl', async (req, res) => {
  const inputUrl = req.body.url;
  const hostname = urlParser.parse(inputUrl).hostname;

      if (!validUrl.isUri(inputUrl)) {  
          return res.status(400).json({ error: 'invalid url' });  
      }  

  dns.lookup(hostname, async (err) => {
    if (err) return res.json({ error: 'invalid url' });

    const count = await Url.estimatedDocumentCount();

    const url = new Url({
      original_url: inputUrl,
      short_url: count + 1
    });

    await url.save();

    res.json({
      original_url: url.original_url,
      short_url: url.short_url
    });
  });
});

// GET: Redirect
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url
  const url = await Url.findOne({ short_url: shortUrl });

  console.log({url})

  if (url) {
    res.redirect(url.original_url);
  } else {
    res.json({ error: 'No short URL found for given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
