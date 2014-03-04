# Craigslist Search Driver

This module makes for simple retrieval of search results from Craigslist.com!

[![Build Status](https://travis-ci.org/brozeph/node-craigslist.png)](https://travis-ci.org/brozeph/node-craigslist)
[![Dependency Status](https://gemnasium.com/brozeph/settings-lib.png)](https://gemnasium.com/brozeph/settings-lib)

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
  client = craigslist.initialize({
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
  client = craigslist.initialize({
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
  url: '/see/vgm/1234567890.html' }
```