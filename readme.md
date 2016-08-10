# Craigslist Search Driver

This module makes for simple retrieval of search results from Craigslist!

[![Build Status](https://travis-ci.org/brozeph/node-craigslist.png)](https://travis-ci.org/brozeph/node-craigslist)
[![Coverage Status](https://coveralls.io/repos/brozeph/node-craigslist/badge.png?branch=master)](https://coveralls.io/r/brozeph/node-craigslist?branch=master)
[![Dependency Status](https://gemnasium.com/brozeph/node-craigslist.png)](https://gemnasium.com/brozeph/settings-lib)

## Installation

```bash
npm install node-craigslist
```

## Usage

Methods optionally accept a callback argument - when supplied, the function will execute the callback with two arguments (`err` and `results`). When omitted, the method call will return a Promise.

### #search

This method can be used to search Craigslist for specific postings.

**Usage:** `client.search(options, query, callback)`

* `options` - _(optional)_ - can be used to supply additional options - see [Options](#options) for details
* `query` - _(required)_ - a string query to search with
* `callback` - _(optional)_ - a function callback that accepts two arguments - if omitted, the function will return a Promise
  * `err` - populated with details in the event of an error
  * `result` - result set details

To use it, it's as simple as the following example:

```javascript
var
  craigslist = require('node-craigslist'),
  client = new craigslist.Client({
    city : 'seattle'
  });

client
  .search('xbox one')
  .then((listings) => {
    // play with listings here...
    listings.forEach((listing) => console.log(listing));
  })
  .catch((err) => {
    console.error(err);
  });
```

### Advanced Usage

In order to filter by category and by price, check out the following example:

```javascript
var
  craigslist = require('node-craigslist'),
  client = new craigslist.Client({
    city : 'seattle'
  }),
  options = {
    category : 'ppa',
    maxAsk : '200',
    minAsk : '100'
  };

client
  .search(options, 'xbox one')
  .then((listings) => {
    // filtered listings (by price)
    listings.forEach((listing) => console.log(listing));
  })
  .catch((err) => {
    console.error(err);
  });
```

### Options

Per request, options can be modified to specify the following:
* a different city than whatever is specified during initialization (`city` option)
* a different country than whatever is specified during initialization (`baseHost` option)
* min and max price ranges (`maxAsk` and `minAsk` options)
* category (`category` option)

```javascript
var
  craigslist = require('node-craigslist'),
  client = new craigslist.Client({
    city : 'seattle'
  }),
  options = {
    baseHost : '', // defaults to craigslist.org
    category : '', // defaults to sss (all)
    city : '',
    maxAsk : '200',
    minAsk : '100'
  };

client
  .search(options, 'xbox one')
  .then((listings) => {
    // listings (from Boston instead of Seattle)
    listings.forEach((listing) => console.log(listing));
  })
  .catch((err) => {
    console.error(err);
  });
```

#### Categories

This list may change based on Craigslist updates, but at the time of v1.9, this is the current list:

* sss = all
* ata = antiques
* ppa = appliances
* ara = arts+crafts
* sna = atvs/utvs/snow
* pta = auto parts
* baa = baby+kids
* bar = barter
* haa = beauty+hlth
* bip = bike parts
* bia = bikes
* bpa = boat parts
* boo = boats
* bka = books
* bfa = business
* cta = cars+trucks
* ema = cds/dvd/vhs
* moa = cell phones
* cla = clothes+acc
* cba = collectibles
* syp = computer parts
* sya = computers
* ela = electronics
* gra = farm+garden
* zip = free stuff
* fua = furniture
* gms = garage sales
* foa = general
* hva = heavy equipment
* hsa = household
* jwa = jewelry
* maa = materials
* mpa = motorcycle parts
* mca = motorcycles
* msa = music instr
* pha = photo+video
* rva = RVs
* sga = sporting
* tia = tickets
* tla = tools
* taa = toys+games
* vga = video gaming
* waa = wanted

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
