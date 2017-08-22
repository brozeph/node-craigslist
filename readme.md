# Craigslist Search Driver

This module makes for simple retrieval of search results from Craigslist!

[![Build Status](https://travis-ci.org/brozeph/node-craigslist.png)](https://travis-ci.org/brozeph/node-craigslist)
[![Coverage Status](https://coveralls.io/repos/brozeph/node-craigslist/badge.png?branch=master)](https://coveralls.io/r/brozeph/node-craigslist?branch=master)

## Installation

```bash
npm install node-craigslist
```

## Usage

Methods optionally accept a callback argument - when supplied, the function will execute the callback with two arguments (`err` and `results`). When omitted, the method call will return a Promise.

### Constructor

When constructing the craigslist client, options specified are used for all subsequent requests (i.e. [#list](#list) and [#search](#search)).

**Usage:** `new craigslist.Client(options)`

* `options` - _(optional)_ - can be used to supply additional options - see [Options](#options) for details
  * `city` - _(optional)_ - defines the city for the search (_NOTE: this field is required by [#list](#list) and [#search](#search) when not specified in the constructor_)
  * `baseHost` - _(optional)_ - allows for specification of the base domain (defaults to `craiglist.org`) to support other countries (i.e. for Canada, `craigslist.ca`)
  * `maxAsk` - _(optional)_ - maximum price
  * `minAsk` - _(optional)_ - minimum price
  * `category` - _(optional)_ - allows for specification of the category (defaults to `sss`) to search in other categories

```javascript
const craigslist = require('node-craigslist');

let client = new craigslist.Client({
  baseHost : 'craigslist.ca',
  city : 'Toronto'
});
```

### #list

This method can be used to grab a listing of Craigslist postings.

**Usage:** `client.list(options, callback)`

* `options` - _(optional)_ - can be used to supply additional options - see [Options](#options) for details
  * `city` - _(optional)_ - defines the city for the search (_NOTE: this field is required when city is not specified in the constructor_)
  * `baseHost` - _(optional)_ - allows for specification of the base domain (defaults to `craiglist.org`) to support other countries (i.e. for Canada, `craigslist.ca`)
  * `maxAsk` - _(optional)_ - maximum price
  * `minAsk` - _(optional)_ - minimum price
  * `offset` - _(optional)_ - offset number of listings returned
  * `category` - _(optional)_ - allows for specification of the category (defaults to `sss`) to search in other categories
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
  .list()
  .then((listings) => {
    // play with listings here...
    listings.forEach((listing) => console.log(listing));
  })
  .catch((err) => {
    console.error(err);
  });
```

Example response:

```javascript
[
  {
    pid: '1234567890',
    category: 'video gaming - by owner',
    date: 'Mar  1',
    hasPic: true,
    price: '250',
    title: 'NEW &amp; UNSEALED XBOX 360 - 250 GB BLACK FRIDAY BUNDLE',
    url: 'https://seattle.craigslist.org/see/vgm/4355583965.html'
  },
  /* results abbreviated */
]
```

### #search

This method can be used to search Craigslist for specific postings.

**Usage:** `client.search(options, query, callback)`

* `options` - _(optional)_ - can be used to supply additional options - see [Options](#options) for details
  * `baseHost` - _(optional)_ - allows for specification of the base domain (defaults to `craiglist.org`) to support other countries (i.e. for Canada, `craigslist.ca`)
  * `bundleDuplicates` - _(optional)_ - when specified, duplicate listings are collapsed on search per Craigslist functionality
  * `category` - _(optional)_ - allows for specification of the category (defaults to `sss`) to search in other categories
  * `city` - _(optional)_ - defines the city for the search (_NOTE: this field is required when city is not specified in the constructor_)
  * `hasPic` - _(optional)_ - when specified, only postings with images are returned
  * `maxAsk` - _(optional)_ - maximum price
  * `minAsk` - _(optional)_ - minimum price
  * `offset` - _(optional)_ - offset number of listings returned
  * `postal` - _(optional)_ - when specified in conjunction with `searchDistance`, the postal code can be used to find posting within a certain range
  * `searchDistance` - _(optional)_ - when specified in conjunction with `postal`, this is the distance range
  * `searchNearby` - _(optional)_ - allows for a search to be performed against nearby locations as well
  * `searchTitlesOnly` - _(optional)_ - performs search against posting titles only and not the posting body
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

In order to search and filter by category and by price, check out the following example:

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

Example response:

```javascript
[
  {
    pid: '1234567890',
    category: 'video gaming - by owner',
    date: 'Mar  1',
    hasPic: true,
    price: '250',
    title: 'NEW &amp; UNSEALED XBOX 360 - 250 GB BLACK FRIDAY BUNDLE',
    url: 'https://seattle.craigslist.org/see/vgm/4355583965.html'
  },
  /* results abbreviated */
]
```

### #details

This method can be used to grab additional information for a specified listing.

**Usage:** `client.details(listing, callback)`

* `listing` - _(required)_ - may be a listing object from a previous [#search](#search) or [#list](#list) call or a `string` URL to the specified posting
* `callback` - _(optional)_ - a function callback that accepts two arguments - if omitted, the function will return a Promise
  * `err` - populated with details in the event of an error
  * `result` - result set details

To grab details for a listing, see the following example:

```javascript
var
  craigslist = require('node-craigslist'),
  client = new craigslist.Client({
    city : 'seattle'
  });

client
  .list()
  .then((listings) => client.details(listings[0]))
  .then((details) => {
    console.log(details);
  })
  .catch((err) => {
    console.error(err);
  });
```

Example response (_NOTE: not all fields are populated if additional information is not found, including phone, contact name, email, images, postedAt and updatedAt_):

```json
{
  "description": "My setup that taught me everything from mixing to scratching. A pair of DJ Consoles by DENON, a 2 channel mixer by Numark, all power supplies and RCA cables included, + ROAD CASE with wheels. I spent just over $1600 on this setup almost 5 years ago. Would love to see the whole thing go as a package, you can have it for $400. Come play around with it before you buy and see how awesome the scratching aspect is! Feels like real 7\'\' records!\n\nIncluded:\nPair of DENON DN-S3000\'s\nNumark DM1050 2 channel Mixer (+ Power Supply)\nRoad Read case with wheels\nRCA Cables for hook up\n\nHoller at me, email, call, or text.\nCheers,\nBro",
  "mapUrl": "https://maps.google.com/maps/preview/@47.690237,-122.344437,16z",
  "pid": "XXXXXXXXXX",
  "replyUrl": "http://seattle.craigslist.org/reply/sea/msg/XXXXXXXXXX",
  "title": "DJ Setup (DENONS + Mixer + Case)",
  "url": "https://seattle.craigslist.org/see/msg/XXXXXXXXXX.html",
  "postedAt": "2016-08-01T21:39:57.000Z",
  "updatedAt": "2016-08-11T16:44:29.000Z",
  "images":
   [ "http://images.craigslist.org/XX404_ggud0ZU38XX_600x450.jpg",
     "http://images.craigslist.org/XXP0P_h2cCxOdjCXX_600x450.jpg,"
     "http://images.craigslist.org/XXm0m_khEDbKM7fXX_600x450.jpg",
     "http://images.craigslist.org/XXZ0Z_c7xXA2eiCXX_600x450.jpg",
     "http://images.craigslist.org/XXp0p_1jB0EqCaqXX_600x450.jpg" ],
  "contactName": "Bro",
  "phoneNumber": "(XXX) XXX-XXXX",
  "email": "XXX-XXXX@XXXX.com"
}
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
  price: '250',
  title: 'NEW &amp; UNSEALED XBOX 360 - 250 GB BLACK FRIDAY BUNDLE',
  url: 'https://seattle.craigslist.org/see/vgm/4355583965.html' }
```
