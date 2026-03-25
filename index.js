require('dotenv').config();
const dns = require('dns');
const { promisify } = require('util');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const urlDatabase = new Map();
const originalToShort = new Map();
const lookup = promisify(dns.lookup);
let currentId = 1;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function(req, res) {
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

  if (originalToShort.has(url)) {
    return res.json({
      original_url: url,
      short_url: originalToShort.get(url)
    });
  }

  const shortUrl = currentId;
  currentId += 1;

  try {
    await lookup(parsedUrl.hostname);
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  urlDatabase.set(shortUrl, url);
  originalToShort.set(url, shortUrl);

  return res.json({
    original_url: url,
    short_url: shortUrl
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = Number(req.params.short_url);

  if (!Number.isInteger(shortUrl) || !urlDatabase.has(shortUrl)) {
    return res.status(404).json({ error: 'No short URL found for the given input' });
  }

  return res.redirect(urlDatabase.get(shortUrl));
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
