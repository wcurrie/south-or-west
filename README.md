Site

On heroku at [bomobserved.herokuapp.com](http://bomobserved.herokuapp.com/)

Resources

* Starting point was this d3 [Multi-Series Line Chart](http://bl.ocks.org/mbostock/3884955) example.
* I needed a good dose of the d3 [reference](https://github.com/mbostock/d3/wiki/API-Reference).
* The mental model for d3 is explained super well [here](http://bost.ocks.org/mike/join/).
* ES6 [Promises](http://www.html5rocks.com/en/tutorials/es6/promises/) for the sake of it.
* [Polyfill](https://github.com/jakearchibald/es6-promise) because otherwise only at most 1/2 the world's browsers can see the page.
* Australian government's BOM json API
* Mouse over [example](http://bl.ocks.org/WillTurman/4631136).
* Cors/cache proxy for BOM data (http server sample on dartlang site).
* Heroku + Dart [write up](http://blog.sethladd.com/2012/08/running-dart-in-cloud-with-heroku.html) from Seth Ladd.
* Sunrise & Sunset times in JS from [suncalc](https://github.com/mourner/suncalc).
* [Coffeescript](http://coffeescript.org/) to avoid function and return on all the lambdas passed to d3.
* Coffeescript compilation using [gulp.js](http://gulpjs.com/) to try it out.
* Drag touch event using [hammer.js](http://eightmedia.github.io/hammer.js/).

Next

* Move to Google's AppEngine to get free scheduled tasks. Use Go on server instead?
* Poll BOM site and store observations?
* Make x-axis scale less odd
* Responsive for iphone: bigger font, drag finger