# v1.2.2 / 2017.10.26

* Fixed #24 - duplicate hostname in posting url property
* Adding attributes property to posting per recommendation from @Jaden-Giordano

# v1.2.1 / 2017.08.22

* Added support for additional craigslist search options (`offset`)

# v1.2.0 / 2017.08.16

* Added support for additional craigslist search options (`searchTitlesOnly`, `hasImage`, `postedToday`, `bundleDuplicates`, `searchNearby`, `searchDistance` and `postal`)

# v1.1.2 / 2017.06.08

* Added support for HTTP proxy requests (issue #15)

# 1.1.1 / 2017.03.13

* Fixed issue #17 - multiple redirects when location in header contains a new host
* Fixed issue #16 - price appears twice in some search results

# 1.1.0 / 2016.11.07

* Updated parser for Craigslist markup to work with new layout

# 1.0.1 / 2016.08.11

* Updated `.travis.yml` file to be more specific about which Node version to test against

# 1.0.0 / 2016.08.08

* Moved to `eslint` instead of `jshint`
* Modified code leveraging language features of `ES2015` and using `babel` to transpile
* Added `debug` dependency to enhance visibility and debugging of module
* Fixed issue #6 - other city links were incorrectly specified
* Fixed issue #7 - unable to specify base host for other countries

# 0.1.9 / 2015.04.20

* Merged excellent pull-request from @jbredice to enable search within categories

# 0.1.8 / 2015.04.08

* Updated markup parsing for date

# 0.1.7 / 2014.08.29

* Moved to Cheerio.js for parsing HTML
* Refactored library to increase readability

# 0.1.6 / 2014.03.09

* Ensuring queries are URI encoded properly

# 0.1.5 / 2014.03.09

* Simplified init (`initialize` function still works, but is unnecessary)

# 0.1.4 / 2014.03.09

* Modified `url` property of search results to include fully qualified URL for each listing

# 0.1.3 / 2014.03.03

* Refactoring of some internals
* Added robust unit tests

# 0.1.2 / 2014.03.03

* Enhanced documentation

# 0.1.1 / 2014.03.03

* Initial release
