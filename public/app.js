var airHeight, color, dewPointLine, extractRainTracePerSite, extractSeriesPerSite, findObservationFor, humidityLine, humidityY, leftHumidityYAxis, leftTemperatureYAxis, load, loadJson, loadThenPlot, margin, nightsPerSite, parseDate, plot, plotBoxHeight, plotYRanges, rainHeight, rainY, rainYAxis, saveStations, showStationList, showTimeAtTopOfMouseLine, showToolTip, showValueAtMouselineIntersection, sites, stations, svg, tempArea, tempLine, tempY, toggleStation, tooltipDateFormat, verticalMouseLine, width, windHeight, windLine, windY, windYAxis, x, xAxis;

stations = [
  {
    name: "Nowra",
    url: "IDN60801/IDN60801.94750",
    load: false
  }, {
    name: "Mt Boyce",
    url: "IDN60801/IDN60801.94743",
    load: false
  }, {
    name: "Sydney (Observatory Hill)",
    url: "IDN60901/IDN60901.94768",
    load: false
  }, {
    name: "Horsham",
    url: "IDV60801/IDV60801.95839",
    load: false
  }, {
    name: "Canberra",
    url: "IDN60903/IDN60903.94926",
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
  xPos = x(now);
  yPos = function(d) {
    return yScale.call(null, d[attr]);
  };
  tipClassName = "tip-" + attr;
  dotClassName = "dot" + attr;
  plotBox = d3.select(".plotBox");
  airTips = plotBox.selectAll("text." + tipClassName).data(observations, joinByName);
  airTips.attr("x", xPos).attr("y", yPos).attr("dx", function() {
    if (xPos < x.range()[1] - 25) {
      return 2;
    } else {
      return -20;
    }
  }).text(function(d) {
    return d[attr] + suffix;
  });
  airTips.enter().append("text").attr("class", tipClassName + " mouseTip").attr("dy", -2);
  airTips.exit().remove();
  airDots = plotBox.selectAll("." + dotClassName).data(observations, joinByName);
  airDots.attr("cx", xPos).attr("cy", yPos);
  airDots.enter().append("circle").attr("class", dotClassName + " mouseTip").attr("r", "2");
  return airDots.exit().remove();
};

showTimeAtTopOfMouseLine = function(now) {
  var mouseTip;
  mouseTip = d3.select(".plotBox").selectAll("text.mousedTime").data([now], function() {
    return 1;
  });
  mouseTip.attr("x", x(now)).attr("y", 0).text(tooltipDateFormat(now));
  return mouseTip.enter().append("text").attr("class", "mousedTime mouseTip").attr("dy", -2).attr("dx", 2);
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
  showValueAtMouselineIntersection(now, observations, "rel_hum", humidityY, "%");
  showValueAtMouselineIntersection(now, observations, "wind_spd_kmh", windY, "km/h");
  return showTimeAtTopOfMouseLine(now);
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
  left: 50,
  graphGap: 10
};

width = 960 - margin.left - margin.right;

plotBoxHeight = 650 + margin.graphGap * 2;

airHeight = 450;

rainHeight = 100;

windHeight = 100;

plotYRanges = [[airHeight, 0], [airHeight + margin.graphGap + windHeight, airHeight + margin.graphGap], [airHeight + margin.graphGap + windHeight + margin.graphGap + rainHeight, airHeight + margin.graphGap + windHeight + margin.graphGap]];

x = d3.time.scale().range([0, width]).clamp(true);

tempY = d3.scale.linear().range(plotYRanges[0]);

windY = d3.scale.linear().range(plotYRanges[1]).clamp(true);

rainY = d3.scale.linear().range(plotYRanges[2]).clamp(true);

humidityY = d3.scale.linear().range(plotYRanges[2]).domain([0, 100]).clamp(true);

color = d3.scale.category10();

xAxis = d3.svg.axis().scale(x).orient("bottom");

leftTemperatureYAxis = d3.svg.axis().scale(tempY).orient("left");

leftHumidityYAxis = d3.svg.axis().scale(humidityY).orient("left");

rainYAxis = d3.svg.axis().scale(rainY).orient("right").ticks(5);

windYAxis = d3.svg.axis().scale(windY).orient("right").ticks(8);

tempLine = d3.svg.line().interpolate("basis").x(function(d) {
  return x(d.date);
}).y(function(d) {
  return tempY(d.airTemp);
});

dewPointLine = d3.svg.line().interpolate("basis").x(function(d) {
  return x(d.date);
}).y(function(d) {
  return tempY(d.observation.dewpt);
});

windLine = d3.svg.line().interpolate("basis").x(function(d) {
  return x(d.date);
}).y(function(d) {
  return windY(d.observation.wind_spd_kmh);
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

svg = d3.select(".chart").append("svg").attr("width", width + margin.left + margin.right).attr("height", plotBoxHeight + margin.top + margin.bottom).append("g").attr("class", "plotBox").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
        return d3.min([v.airTemp, v.apparentTemp, v.observation.dewpt]);
      });
    }), d3.max(sites, function(site) {
      return d3.max(site.values, function(v) {
        return d3.max([v.airTemp, v.apparentTemp, v.observation.dewpt]);
      });
    }) + 1
  ]);
  rainY.domain([
    0, Math.max(2, d3.max(rainTracePerSite, function(site) {
      return d3.max(site.values, function(v) {
        return v.rain;
      });
    }))
  ]);
  windY.domain([
    0, d3.max(sites, function(site) {
      return d3.max(site.values, function(v) {
        return v.observation.wind_spd_kmh;
      });
    })
  ]);
  svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + plotBoxHeight + ")").call(xAxis);
  svg.append("g").attr("class", "tempY axis").call(leftTemperatureYAxis).append("text").attr("transform", "rotate(-90)").attr("y", -25).style("text-anchor", "end").html("Temperature (&deg;C)");
  svg.append("g").attr("class", "rightY axis").attr("transform", "translate(" + width + ",0)").call(windYAxis).append("text").attr("transform", "rotate(-90)").attr("y", 50).attr("x", -windY.range()[0]).style("text-anchor", "start").html("Wind (km/h)");
  svg.append("g").attr("class", "humidityY axis").call(leftHumidityYAxis).append("text").attr("transform", "rotate(-90)").attr("y", -35).attr("x", -humidityY.range()[0]).style("text-anchor", "start").html("Humidity (%)");
  svg.append("g").attr("class", "rightY axis").attr("transform", "translate(" + width + ",0)").call(rainYAxis).append("text").attr("transform", "rotate(-90)").attr("y", 50).attr("x", -rainY.range()[0]).style("text-anchor", "start").html("Rain since 9am (mm)");
  svg.selectAll(".night").data(nights[0]).enter().append("rect").attr("x", function(d) {
    return x(d.start);
  }).attr("width", function(d) {
    return x(d.end) - x(d.start);
  }).attr("y", 0).attr("height", plotBoxHeight).attr("class", "night");
  site = svg.selectAll(".site").data(sites).enter().append("g").attr("class", "site");
  site.append("path").attr("class", "line").attr("d", function(d) {
    return tempLine(d.values);
  }).style("stroke", colorByName);
  site.append("path").attr("class", "area").style("fill", colorByName).datum(function(d) {
    return d.values;
  }).attr("d", tempArea);
  site.append("path").attr("class", "dewPointLine").attr("d", function(d) {
    return dewPointLine(d.values);
  }).style("stroke", colorByName);
  site.append("path").attr("class", "line").attr("d", function(d) {
    return windLine(d.values);
  }).style("stroke", colorByName);
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
  site.append("text").datum(function(d) {
    return {
      name: d.name,
      value: d.values[d.values.length - 1]
    };
  }).attr("transform", function(d) {
    return "translate(" + x(d.value.date) + "," + tempY(d.value.observation.dewpt) + ")";
  }).attr("x", 3).attr("dy", ".35em").text("Dew Point").attr("class", "mouseTip").style("opacity", 0);
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
    return rainY.range()[0] - rainY(d.rain);
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
    return site.values[site.values.length - 1].observation;
  });
  showToolTip(parseDate(mostRecent[0].local_date_time_full), mostRecent);
  return d3.selectAll(".tooltip,.explanation,.disclaimer").style("visibility", "");
};

loadThenPlot = function() {
  return load().then(plot)["catch"](function(error) {
    console.error(error);
    return console.log(error.stack);
  });
};

verticalMouseLine = d3.select(".chart").append("div").attr("class", "mouseLine").style("position", "absolute").style("z-index", "19").style("width", "1px").style("height", plotBoxHeight + "px").style("top", "32px").style("bottom", "30px").style("left", "0px").style("background", "#000").style("opacity", "0");

d3.select(".chart").on("mousemove", function() {
  var mouseX, observed, time, translatedMouseX;
  mouseX = d3.mouse(this)[0];
  translatedMouseX = mouseX - margin.left;
  if (sites && translatedMouseX > 0 && translatedMouseX < width) {
    verticalMouseLine.style("left", (mouseX + 7) + "px");
    time = x.invert(translatedMouseX);
    observed = sites.map(function(site) {
      return findObservationFor(site, time);
    });
    return showToolTip(time, observed);
  }
}).on("mouseover", function() {
  d3.select(".mouseLine").transition().duration(250).style("opacity", 0.5);
  return d3.selectAll(".mouseTip").transition().duration(250).style("opacity", 1);
}).on("mouseout", function() {
  return d3.selectAll(".mouseLine,.mouseTip").transition().duration(400).style("opacity", 0);
});

showStationList = function() {
  var lis, s, savedStations, _i, _len, _ref, _results;
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
  if (localStorage) {
    savedStations = localStorage.getItem("stations");
    _ref = JSON.parse(savedStations || '["Nowra", "Mt Boyce"]');
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      s = _ref[_i];
      stations.filter(function(d) {
        return d.name === s;
      })[0].load = true;
      _results.push(document.getElementById("show-" + s).checked = true);
    }
    return _results;
  }
};

saveStations = function() {
  if (localStorage) {
    return localStorage.setItem("stations", JSON.stringify(stations.filter(function(d) {
      return d.load;
    }).map(function(d) {
      return d.name;
    })));
  }
};

toggleStation = function(name) {
  var station;
  station = stations.filter(function(s) {
    return s.name === name;
  })[0];
  station.load = !station.load;
  saveStations();
  return loadThenPlot();
};

showStationList();

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
