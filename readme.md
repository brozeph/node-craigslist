# Craigslist Search Driver

This module makes for simple retrieval of search results from Craigslist.com!

[![Build Status](https://travis-ci.org/brozeph/node-craigslist.png)](https://travis-ci.org/brozeph/node-craigslist)
[![Coverage Status](https://coveralls.io/repos/brozeph/node-craigslist/badge.png?branch=master)](https://coveralls.io/r/brozeph/node-craigslist?branch=master)
[![Dependency Status](https://gemnasium.com/brozeph/settings-lib.png)](https://gemnasium.com/brozeph/settings-lib)
[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/brozeph/node-craigslist/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

## Installation

```bash
npm install node-craigslist
```

## Usage

### Search

To use it, it's as simple as the following example:

```javascript
var
  craigslist = require('node-craigslist');
  client = craigslist({
    city : 'seattle'
  });

client.search('xbox one', function (err, listings) {
  // play with listings here...
  listings.forEach(function (listing) {
    console.log(listing);
  });
});

```

### Advanced Search

Do you want to filter by price? Check out the following example:

```javascript
var
  craigslist = require('node-craigslist');
  client = craigslist({
    city : 'seattle'
  }),
  options = {
    maxAsk : '200',
    minAsk : '100'
  };

client.search(options, 'xbox one', function (err, listings) {
  // filtered listings (by price)
});
```

### Options

Per request, options can be modified to specify a different city than whatever is specified during initialization:

```javascript
var
  craigslist = require('node-craigslist');
  client = craigslist({
    city : 'seattle'
  }),
  options = {
    city : 'boston'
  };

client.search(options, 'xbox one', function (err, listings) {
  // listings (from Boston instead of Seattle)
});
```

### Listing Object

Each listing returned has several properties... see the example below:

```javascript
{ pid: '1234567890',
  category: 'video gaming - by owner',
  date: 'Mar  1',
  hasPic: true,
  location: 'Seattle',
  price: '250',
  title: 'NEW &amp; UNSEALED XBOX 360 - 250 GB BLACK FRIDAY BUNDLE',
  url: 'https://seattle.craigslist.org/see/vgm/4355583965.html' }
```
