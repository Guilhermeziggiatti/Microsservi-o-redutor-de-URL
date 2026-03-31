require('dotenv').config();
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const dataFilePath = path.join(process.cwd(), 'short-urls.json');
const urlDatabase = new Map();
const originalToShort = new Map();
const lookup = promisify(dns.lookup);
let currentId = 1;

function getRequestContext(req) {
  return {
    method: req.method,
    path: req.originalUrl,
    userAgent: req.get('user-agent') || 'unknown',
    referer: req.get('referer') || 'none',
    origin: req.get('origin') || 'none'
  };
}

function logRequest(event, details) {
  console.log(`[shorturl] ${event}`, JSON.stringify(details));
}

function loadUrlData() {
  if (!fs.existsSync(dataFilePath)) {
    return;
  }

  try {
    const savedUrls = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    savedUrls.forEach(function(entry) {
      urlDatabase.set(entry.short_url, entry.original_url);
      originalToShort.set(entry.original_url, entry.short_url);

      if (entry.short_url >= currentId) {
        currentId = entry.short_url + 1;
      }
    });
  } catch (error) {
    console.error('Could not load saved short URLs.');
  }
}

function persistUrlData() {
  const savedUrls = Array.from(urlDatabase.entries()).map(function([shortUrl, originalUrl]) {
    return {
      short_url: shortUrl,
      original_url: originalUrl
    };
  });

  fs.writeFileSync(dataFilePath, JSON.stringify(savedUrls, null, 2));
}

loadUrlData();

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
  const requestContext = getRequestContext(req);

  logRequest('post_received', {
    ...requestContext,
    submittedUrl: url || null
  });

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    logRequest('post_invalid_url_parse', {
      ...requestContext,
      submittedUrl: url || null
    });
    return res.json({ error: 'invalid url' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    logRequest('post_invalid_protocol', {
      ...requestContext,
      submittedUrl: url,
      protocol: parsedUrl.protocol
    });
    return res.json({ error: 'invalid url' });
  }

  if (originalToShort.has(url)) {
    logRequest('post_existing_url', {
      ...requestContext,
      submittedUrl: url,
      shortUrl: originalToShort.get(url)
    });
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
    logRequest('post_dns_lookup_failed', {
      ...requestContext,
      submittedUrl: url,
      hostname: parsedUrl.hostname
    });
    return res.json({ error: 'invalid url' });
  }

  urlDatabase.set(shortUrl, url);
  originalToShort.set(url, shortUrl);
  persistUrlData();

  logRequest('post_short_url_created', {
    ...requestContext,
    submittedUrl: url,
    shortUrl
  });

  return res.json({
    original_url: url,
    short_url: shortUrl
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = Number(req.params.short_url);
  const requestContext = getRequestContext(req);

  if (!Number.isInteger(shortUrl) || !urlDatabase.has(shortUrl)) {
    logRequest('get_short_url_not_found', {
      ...requestContext,
      shortUrlParam: req.params.short_url
    });
    return res.status(404).json({ error: 'No short URL found for the given input' });
  }

  const originalUrl = urlDatabase.get(shortUrl);

  logRequest('get_short_url_redirect', {
    ...requestContext,
    shortUrl,
    originalUrl
  });

  return res.redirect(302, originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
