require('dotenv').config();
const dns = require('dns');
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const urlDatabase = [];
let currentId = 1;

app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  const { url } = req.body;
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsedUrl.hostname, function(error) {
    if (error) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = currentId;
    currentId += 1;

    urlDatabase.push({
      short_url: shortUrl,
      original_url: url
    });

    return res.json({
      original_url: url,
      short_url: shortUrl
    });
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = Number(req.params.short_url);
  const urlEntry = urlDatabase.find(function(entry) {
    return entry.short_url === shortUrl;
  });

  if (!urlEntry) {
    return res.json({ error: 'invalid url' });
  }

  res.statusCode = 302;
  res.setHeader('Location', urlEntry.original_url);
  return res.end();
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
