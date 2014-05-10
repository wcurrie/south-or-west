var airHeight, color, extractRainTracePerSite, extractSeriesPerSite, findObservationFor, height, humidityLine, humidityY, leftHumidityYAxis, leftTemperatureYAxis, lis, load, loadJson, loadThenPlot, margin, nightsPerSite, parseDate, plot, rainHeight, rainY, rightYAxis, showToolTip, showValueAtMouselineIntersection, sites, stations, svg, tempArea, tempLine, tempY, toggleStation, tooltipDateFormat, verticalMouseLine, width, x, xAxis;

stations = [
  {
    name: "Nowra",
    url: "IDN60801/IDN60801.94750",
    load: true
  }, {
    name: "Mt Boyce",
    url: "IDN60801/IDN60801.94743",
    load: true
  }, {
    name: "Sydney (Observatory Hill)",
    url: "IDN60901/IDN60901.94768",
    load: false
  }, {
    name: "Horsham",
    url: "IDV60801/IDV60801.95839",
    load: false
  }
];

loadJson = function(url) {
  return new Promise(function(resolve, reject) {
    return d3.json(url, function(error, data) {
      if (error) {
        return reject(error);
      } else {
        return resolve(data);
      }
    });
  });
};

findObservationFor = function(site, date) {
  var reference, scored;
  reference = date.getTime();
  scored = site.values.map(function(d) {
    return {
      delta: Math.abs(reference - d.date.getTime()),
      observation: d.observation
    };
  });
  scored.sort(function(a, b) {
    return a.delta - b.delta;
  });
  return scored[0].observation;
};

showValueAtMouselineIntersection = function(now, observations, attr, yScale, suffix) {
  var airDots, airTips, dotClassName, joinByName, plotBox, tipClassName, xPos, yPos;
  joinByName = function(d) {
    return d.name;
  };
  xPos = function() {
    return x(now);
  };
  yPos = function(d) {
    return yScale.call(null, d[attr]);
  };
  tipClassName = "tip-" + attr;
  dotClassName = "dot" + attr;
  plotBox = d3.select(".plotBox");
  airTips = plotBox.selectAll("text." + tipClassName).data(observations, joinByName);
  airTips.attr("x", xPos).attr("y", yPos).text(function(d) {
    return d[attr] + suffix;
  });
  airTips.enter().append("text").attr("class", tipClassName).attr("dy", -2).attr("dx", 2);
  airTips.exit().remove();
  airDots = plotBox.selectAll("." + dotClassName).data(observations, joinByName);
  airDots.attr("cx", xPos).attr("cy", yPos);
  airDots.enter().append("circle").attr("class", dotClassName).attr("r", "2");
  return airDots.exit().remove();
};

tooltipDateFormat = d3.time.format("%d %B %H:%M");

showToolTip = function(now, observations) {
  var row, rows;
  document.getElementById("time").textContent = tooltipDateFormat(now);
  rows = d3.select("#observations").selectAll("tr").data(observations);
  row = rows.enter().append("tr");
  row.append("td").attr("class", "name");
  row.append("td").attr("class", "airTemp");
  row.append("td").attr("class", "apparentTemp");
  row.append("td").attr("class", "humidity");
  row.append("td").attr("class", "wind");
  row.append("td").attr("class", "rain");
  rows.select(".name").text(function(d) {
    return d.name;
  });
  rows.select(".airTemp").text(function(d) {
    return d.air_temp;
  });
  rows.select(".apparentTemp").text(function(d) {
    return d.apparent_t;
  });
  rows.select(".humidity").text(function(d) {
    return d.rel_hum;
  });
  rows.select(".wind").text(function(d) {
    return d.wind_spd_kmh;
  });
  rows.select(".rain").text(function(d) {
    return d.rain_trace;
  });
  showValueAtMouselineIntersection(now, observations, "air_temp", tempY, "\u00B0");
  showValueAtMouselineIntersection(now, observations, "apparent_t", tempY, "\u00B0");
  return showValueAtMouselineIntersection(now, observations, "rel_hum", humidityY, "%");
};

toggleStation = function(name) {
  var station;
  station = stations.filter(function(s) {
    return s.name === name;
  })[0];
  station.load = !station.load;
  return loadThenPlot();
};

sites = void 0;

load = function() {
  var urls;
  urls = stations.filter(function(s) {
    return s.load;
  }).map(function(s) {
    return "/fwo/" + s.url + ".json";
  });
  return Promise.all(urls.map(loadJson));
};

margin = {
  top: 20,
  right: 80,
  bottom: 30,
  left: 50
};

width = 960 - margin.left - margin.right;

height = 550 - margin.top - margin.bottom;

rainHeight = 100;

airHeight = height - rainHeight;

x = d3.time.scale().range([0, width]).clamp(true);

tempY = d3.scale.linear().range([airHeight, 0]);

rainY = d3.scale.linear().range([height, airHeight]).clamp(true);

humidityY = d3.scale.linear().range([height, airHeight]).domain([0, 100]).clamp(true);

color = d3.scale.category10();

xAxis = d3.svg.axis().scale(x).orient("bottom");

leftTemperatureYAxis = d3.svg.axis().scale(tempY).orient("left");

leftHumidityYAxis = d3.svg.axis().scale(humidityY).orient("left");

rightYAxis = d3.svg.axis().scale(rainY).orient("right");

tempLine = d3.svg.line().interpolate("basis").x(function(d) {
  return x(d.date);
}).y(function(d) {
  return tempY(d.airTemp);
});

humidityLine = d3.svg.line().interpolate("basis").x(function(d) {
  return x(d.date);
}).y(function(d) {
  return humidityY(d.observation.rel_hum);
});

tempArea = d3.svg.area().x(function(d) {
  return x(d.date);
}).y0(function(d) {
  return tempY(d.apparentTemp);
}).y1(function(d) {
  return tempY(d.airTemp);
});

svg = d3.select(".chart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("class", "plotBox").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

plot = function(data) {
  var buckets, colorByName, mostRecent, nights, rainTracePerSite, rainTraces, site;
  svg.selectAll("*").remove();
  d3.select("#observations").selectAll("tr").remove();
  sites = extractSeriesPerSite(data);
  rainTracePerSite = extractRainTracePerSite(sites);
  nights = nightsPerSite(data);
  color.domain(sites.map(function(site) {
    return site.name;
  }));
  colorByName = function(d) {
    return color(d.name);
  };
  x.domain([
    d3.min(sites, function(site) {
      return d3.min(site.values, function(v) {
        return v.date;
      });
    }), d3.max(sites, function(site) {
      return d3.max(site.values, function(v) {
        return v.date;
      });
    })
  ]);
  tempY.domain([
    d3.min(sites, function(site) {
      return d3.min(site.values, function(v) {
        return d3.min([v.airTemp, v.apparentTemp]);
      });
    }), d3.max(sites, function(site) {
      return d3.max(site.values, function(v) {
        return d3.max([v.airTemp, v.apparentTemp]);
      });
    })
  ]);
  rainY.domain([
    0, d3.max(rainTracePerSite, function(site) {
      return d3.max(site.values, function(v) {
        return v.rain;
      });
    })
  ]);
  svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
  svg.append("g").attr("class", "tempY axis").call(leftTemperatureYAxis).append("text").attr("transform", "rotate(-90)").attr("y", -25).style("text-anchor", "end").html("Temperature (&deg;C)");
  svg.append("g").attr("class", "humidityY axis").call(leftHumidityYAxis).append("text").attr("transform", "rotate(-90)").attr("y", -35).attr("x", -400).style("text-anchor", "end").html("Humidity (%)");
  svg.append("g").attr("class", "rightY axis").attr("transform", "translate(" + width + ",0)").call(rightYAxis).append("text").attr("transform", "rotate(-90)").attr("y", 50).attr("x", -400).style("text-anchor", "end").html("Rain since 9am (mm)");
  svg.selectAll(".night").data(nights[0]).enter().append("rect").attr("x", function(d) {
    return x(d.start);
  }).attr("width", function(d) {
    return x(d.end) - x(d.start);
  }).attr("y", 0).attr("height", height).attr("class", "night");
  site = svg.selectAll(".site").data(sites).enter().append("g").attr("class", "site");
  site.append("path").attr("class", "line").attr("d", function(d) {
    return tempLine(d.values);
  }).style("stroke", colorByName);
  site.append("path").attr("class", "area").style("fill", colorByName).datum(function(d) {
    return d.values;
  }).attr("d", tempArea);
  site.append("path").attr("class", "line").attr("d", function(d) {
    return humidityLine(d.values);
  }).style("stroke", colorByName);
  site.append("text").datum(function(d) {
    return {
      name: d.name,
      value: d.values[d.values.length - 1]
    };
  }).attr("transform", function(d) {
    return "translate(" + x(d.value.date) + "," + tempY(d.value.airTemp) + ")";
  }).attr("x", 3).attr("dy", ".35em").text(function(d) {
    return d.name;
  });
  svg.selectAll(".site").attr("opacity", 1).on("mouseover", function(d, i) {
    return svg.selectAll(".site").transition().duration(250).attr("opacity", function(d, j) {
      var _ref;
      return (_ref = j !== i) != null ? _ref : {
        0.6: 1
      };
    });
  }).on("mouseout", function() {
    return svg.selectAll(".site").transition().duration(250).attr("opacity", 1);
  });
  rainTraces = svg.selectAll(".rainTrace").data(rainTracePerSite).enter().append("g").attr("class", "rainTrace").attr("fill", colorByName).style("stroke", colorByName);
  buckets = rainTraces.selectAll("rect").data(function(d) {
    return d.values;
  }).enter();
  buckets.append("rect").attr("x", function(d) {
    return x(d.start);
  }).attr("y", function(d) {
    return rainY(d.rain);
  }).attr("width", function(d) {
    return x(d.end) - x(d.start);
  }).attr("height", function(d) {
    return height - rainY(d.rain);
  });
  buckets.append("line").attr("x1", function(d) {
    return x(d.start);
  }).attr("x2", function(d) {
    return x(d.end);
  }).attr("y1", function(d) {
    return rainY(d.rain);
  }).attr("y2", function(d) {
    return rainY(d.rain);
  });
  mostRecent = sites.map(function(site) {
    return site.values[0].observation;
  });
  showToolTip(parseDate(mostRecent[0].local_date_time_full), mostRecent);
  return d3.selectAll(".tooltip,.explanation").style("visibility", "");
};

loadThenPlot = function() {
  return load().then(plot)["catch"](function(error) {
    console.error(error);
    return console.log(error.stack);
  });
};

verticalMouseLine = d3.select(".chart").append("div").attr("class", "mouseLine").style("position", "absolute").style("z-index", "19").style("width", "1px").style("height", "500px").style("top", "30px").style("bottom", "30px").style("left", "0px").style("background", "#000").style("opacity", "0.5");

d3.select(".chart").on("mousemove", function() {
  var mouseX, observed, time;
  if (sites) {
    mouseX = d3.mouse(this)[0];
    verticalMouseLine.style("left", (mouseX + 7) + "px");
    time = x.invert(mouseX - margin.left);
    observed = sites.map(function(site) {
      return findObservationFor(site, time);
    });
    return showToolTip(time, observed);
  }
});

lis = d3.select("#source-list").selectAll("li").data(stations).enter().append("li");

lis.append("input").attr("type", "checkbox").attr("onclick", function(d) {
  return "toggleStation('" + d.name + "')";
}).attr("id", function(d) {
  return "show-" + d.name;
});

lis.append("a").attr("href", function(d) {
  return "http://www.bom.gov.au/products/" + d.url + ".shtml";
}).text(function(d) {
  return d.name;
});

stations.forEach(function(s) {
  if (s.load) {
    return document.getElementById("show-" + s.name).checked = true;
  }
});

loadThenPlot();

parseDate = d3.time.format("%Y%m%d%H%M%S").parse;


/*
  Crunching data. Probably best moved to server side...
 */

nightsPerSite = function(sites) {
  var parseDay;
  parseDay = d3.time.format("%Y%m%d").parse;
  return sites.map(function(site) {
    var dates, endOfTime, lat, lon, nights, startOfTime, timesPerDay;
    lat = 0;
    lon = 0;
    dates = d3.set();
    site.observations.data.forEach(function(d) {
      dates.add(d.local_date_time_full.substr(0, 8));
      lat = d.lat;
      return lon = d.lon;
    });
    timesPerDay = dates.values().sort(d3.ascending).map(function(d) {
      var times;
      times = SunCalc.getTimes(parseDay(d), lat, lon);
      return {
        up: times.sunrise,
        down: times.sunset
      };
    });
    startOfTime = new Date(0);
    endOfTime = new Date(Math.pow(2, 32) * 1000);
    nights = [
      {
        start: startOfTime,
        end: timesPerDay[0].up
      }
    ];
    timesPerDay.forEach(function(t, i) {
      return nights.push({
        start: t.down,
        end: i + 1 < timesPerDay.length ? timesPerDay[i + 1].up : endOfTime
      });
    });
    return nights;
  });
};

extractSeriesPerSite = function(data) {
  var ascendingByDate;
  ascendingByDate = function(d1, d2) {
    return d3.ascending(d1.date.getTime(), d2.date.getTime());
  };
  return data.map(function(site) {
    return {
      name: site.observations.header[0].name,
      values: site.observations.data.map(function(d) {
        return {
          date: parseDate(d.local_date_time_full),
          airTemp: d.air_temp,
          apparentTemp: d.apparent_t,
          observation: d
        };
      }).sort(ascendingByDate)
    };
  });
};

extractRainTracePerSite = function(sites) {
  var endOfTime, startOfTime;
  startOfTime = new Date(0);
  endOfTime = new Date(Math.pow(2, 32) * 1000);
  return sites.map(function(site) {
    var values;
    values = site.values.map(function(d, i, values) {
      return {
        start: i === 0 ? startOfTime : d.date,
        end: i + 1 < values.length ? values[i + 1].date : endOfTime,
        rain: parseFloat(d.observation.rain_trace)
      };
    }).filter(function(v) {
      return v.rain > 0;
    });
    return {
      name: site.name,
      values: values
    };
  });
};