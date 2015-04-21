# Craigslist Search Driver

This module makes for simple retrieval of search results from Craigslist.com!

[![Build Status](https://travis-ci.org/brozeph/node-craigslist.png)](https://travis-ci.org/brozeph/node-craigslist)
[![Coverage Status](https://coveralls.io/repos/brozeph/node-craigslist/badge.png?branch=master)](https://coveralls.io/r/brozeph/node-craigslist?branch=master)
[![Dependency Status](https://gemnasium.com/brozeph/node-craigslist.png)](https://gemnasium.com/brozeph/settings-lib)

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

Do you want to filter by category and by price? Check out the following example:

```javascript
var
  craigslist = require('node-craigslist');
  client = craigslist({
    city : 'seattle'
  }),
  options = {
    category : 'ppa',
    maxAsk : '200',
    minAsk : '100'
  };

client.search(options, 'xbox one', function (err, listings) {
  // filtered listings (by price)
});
```

### Options

Per request, options can be modified to specify the following:
* a different city than whatever is specified during initialization
* min and max price ranges
* category

```javascript
var
  craigslist = require('node-craigslist');
  client = craigslist({
    city : 'seattle'
  }),
  options = {
    category : '', // defaults to sss (all)
    city : 'boston',
    maxAsk : '200',
    minAsk : '100'
  };

client.search(options, 'xbox one', function (err, listings) {
  // listings (from Boston instead of Seattle)
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
