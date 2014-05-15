var BomObservations;

angular.module('bom.observations', []).factory('BomStations', function() {
  return [
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
}).factory('Observations', function($http, $q) {
  var loadStation;
  loadStation = function(url) {
    return $http({
      method: 'GET',
      url: url
    });
  };
  return {
    load: function(stations) {
      var urls;
      urls = stations.filter(function(s) {
        return s.load;
      }).map(function(s) {
        return "/fwo/" + s.url + ".json";
      });
      return $q.all(urls.map(loadStation)).then(function(responses) {
        return responses.map(function(r) {
          return r.data;
        });
      })["catch"](function(data, status) {
        return console.log(data, status);
      });
    }
  };
}).factory('Preferences', function(BomStations) {
  return {
    load: function() {
      var s, savedStations, _i, _len, _ref;
      if (localStorage) {
        savedStations = localStorage.getItem("stations");
        _ref = JSON.parse(savedStations || '["Nowra", "Mt Boyce"]');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          BomStations.filter(function(d) {
            return d.name === s;
          })[0].load = true;
        }
      }
      return BomStations;
    },
    save: function(stations) {
      if (localStorage) {
        return localStorage.setItem("stations", JSON.stringify(stations.filter(function(d) {
          return d.load;
        }).map(function(d) {
          return d.name;
        })));
      }
    }
  };
}).directive('bomPersist', function(Preferences) {
  return {
    link: function(scope, element, attrs) {
      return scope.$watch(attrs.bomPersist, function(v) {
        return Preferences.save(v);
      }, true);
    }
  };
});

BomObservations = (function() {
  var parseDate;

  function BomObservations(dataPerSite) {
    this.dataPerSite = dataPerSite;
    this.seriesPerSite = this.extractSeriesPerSite(this.dataPerSite);
    this.rainTracesPerSite = this.extractRainTracePerSite(this.seriesPerSite);
    this.nightsPerSite = this.extractNightsPerSite(this.dataPerSite);
  }


  /*
    Crunching data. Probably best moved to server side... a
   */

  parseDate = d3.time.format("%Y%m%d%H%M%S").parse;

  BomObservations.prototype.extractNightsPerSite = function(sites) {
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

  BomObservations.prototype.extractSeriesPerSite = function(data) {
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

  BomObservations.prototype.extractRainTracePerSite = function(sites) {
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

  return BomObservations;

})();

angular.module('bom.plot', ['bom.observations']).directive('bomPlot', function(Observations) {
  return {
    link: function(scope, element, attrs) {
      var airHeight, attrOrDefault, color, createMouseLine, dewPointLine, findObservationFor, hideMouseLine, humidityLine, humidityY, leftHumidityYAxis, leftTemperatureYAxis, margin, mouseLineDateFormat, moveMouseLine, plot, plotBoxHeight, plotYRanges, rainHeight, rainY, rainYAxis, showMouseLine, showTimeAtTopOfMouseLine, showToolTip, showValueAtMouselineIntersection, sites, tempArea, tempLine, tempY, tooltipDateFormat, width, windArea, windHeight, windLine, windY, windYAxis, x, xAxis;
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
      showValueAtMouselineIntersection = function(now, observations, collisionGuard, attr, yScale, suffix) {
        var airDots, airTips, clearOfRightYAxis, debounced, dotClassName, joinByName, plotBox, tipClassName, xPos, yPos;
        joinByName = function(d) {
          return d.name;
        };
        xPos = x(now);
        yPos = function(d) {
          return yScale.call(null, d[attr]);
        };
        clearOfRightYAxis = xPos < x.range()[1] - 40;
        debounced = observations.filter(function(d) {
          return collisionGuard(yPos(d));
        });
        tipClassName = "tip-" + attr;
        dotClassName = "dot" + attr;
        plotBox = d3.select(".plotBox");
        airTips = plotBox.selectAll("text." + tipClassName).data(debounced, joinByName);
        airTips.attr("x", xPos).attr("y", yPos).attr("dx", function() {
          if (clearOfRightYAxis) {
            return 2;
          } else {
            return -2;
          }
        }).style("text-anchor", function() {
          if (clearOfRightYAxis) {
            return "start";
          } else {
            return "end";
          }
        }).text(function(d) {
          return d[attr] + suffix;
        });
        airTips.enter().append("text").attr("class", tipClassName + " mouseTip").attr("dy", -2);
        airTips.exit().remove();
        airDots = plotBox.selectAll("." + dotClassName).data(debounced, joinByName);
        airDots.attr("cx", xPos).attr("cy", yPos);
        airDots.enter().append("circle").attr("class", dotClassName + " mouseTip").attr("r", "2");
        return airDots.exit().remove();
      };
      showTimeAtTopOfMouseLine = function(now) {
        var mouseTip;
        mouseTip = d3.select(".plotBox").selectAll("text.mousedTime").data([now], function() {
          return 1;
        });
        mouseTip.attr("x", x(now)).attr("y", 0).text(mouseLineDateFormat(now));
        return mouseTip.enter().append("text").attr("class", "mousedTime mouseTip").attr("dy", -2).attr("dx", 2);
      };
      mouseLineDateFormat = d3.time.format("%a %H:%M");
      tooltipDateFormat = d3.time.format("%d %B %H:%M");
      showToolTip = function(now, observations) {
        var collisionGuard, usedYValues;
        scope.now = tooltipDateFormat(now);
        scope.currentObservations = observations;
        usedYValues = [];
        collisionGuard = function(newY) {
          var collision;
          collision = usedYValues.filter(function(y) {
            return Math.abs(y - newY) < 8;
          }).length > 0;
          if (!collision) {
            usedYValues.push(newY);
          }
          return !collision;
        };
        showValueAtMouselineIntersection(now, observations, collisionGuard, "air_temp", tempY, "\u00B0");
        showValueAtMouselineIntersection(now, observations, collisionGuard, "apparent_t", tempY, "\u00B0");
        showValueAtMouselineIntersection(now, observations, collisionGuard, "rel_hum", humidityY, "%");
        showValueAtMouselineIntersection(now, observations, collisionGuard, "wind_spd_kmh", windY, "");
        showValueAtMouselineIntersection(now, observations, collisionGuard, "gust_kmh", windY, "");
        showValueAtMouselineIntersection(now, observations, collisionGuard, "dewpt", tempY, "\u00B0");
        return showTimeAtTopOfMouseLine(now);
      };
      sites = void 0;
      attrOrDefault = function(attr, d) {
        if (attrs[attr]) {
          return +attrs[attr];
        } else {
          return d;
        }
      };
      margin = {
        top: 20,
        right: 80,
        bottom: 30,
        left: 50,
        graphGap: attrOrDefault("gapHeight", 15)
      };
      width = 960 - margin.left - margin.right;
      airHeight = attrOrDefault("airHeight", 450);
      rainHeight = attrOrDefault("rainHeight", 100);
      windHeight = attrOrDefault("windHeight", 100);
      plotBoxHeight = (airHeight + rainHeight + windHeight) + margin.graphGap * 2;
      plotYRanges = [[airHeight, 0], [airHeight + margin.graphGap + windHeight, airHeight + margin.graphGap], [airHeight + margin.graphGap + windHeight + margin.graphGap + rainHeight, airHeight + margin.graphGap + windHeight + margin.graphGap]];
      x = d3.time.scale().range([0, width]).clamp(true);
      tempY = d3.scale.linear().range(plotYRanges[0]);
      windY = d3.scale.linear().range(plotYRanges[1]).clamp(true);
      rainY = d3.scale.linear().range(plotYRanges[2]).clamp(true);
      humidityY = d3.scale.linear().range(plotYRanges[2]).domain([0, 100]).clamp(true);
      color = d3.scale.category10();
      xAxis = d3.svg.axis().scale(x).orient("bottom");
      leftTemperatureYAxis = d3.svg.axis().scale(tempY).orient("left");
      leftHumidityYAxis = d3.svg.axis().scale(humidityY).orient("left").ticks(5);
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
      windArea = d3.svg.area().x(function(d) {
        return x(d.date);
      }).y0(function(d) {
        return windY(d.observation.wind_spd_kmh);
      }).y1(function(d) {
        return windY(d.observation.gust_kmh);
      });
      plot = function(data) {
        var buckets, colorByName, mostRecent, observations, plotBox, rainLabel, rainTracePerSite, rainTraces, site, svgRoot;
        plotBox = d3.select(".chart").select("svg").select("g");
        if (plotBox.empty()) {
          svgRoot = d3.select(".chart").append("svg").attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (plotBoxHeight + margin.top + margin.bottom));
          plotBox = svgRoot.append("g").attr("class", "plotBox").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          createMouseLine(svgRoot);
        } else {
          plotBox.selectAll("*").remove();
        }
        d3.select("#observations").selectAll("tr").remove();
        observations = new BomObservations(data);
        sites = observations.seriesPerSite;
        rainTracePerSite = observations.rainTracesPerSite;
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
              return d3.max([v.observation.wind_spd_kmh, v.observation.gust_kmh]);
            });
          })
        ]);
        plotBox.append("g").attr("class", "x axis").attr("transform", "translate(0," + plotBoxHeight + ")").call(xAxis);
        plotBox.append("g").attr("class", "tempY axis").call(leftTemperatureYAxis).append("text").attr("transform", "rotate(-90)").attr("y", -35).style("text-anchor", "end").html("Temperature (&deg;C)");
        plotBox.append("g").attr("class", "rightY axis").attr("transform", "translate(" + width + ",0)").call(windYAxis).append("text").attr("transform", "rotate(-90)").attr("y", 50).attr("x", -windY.range()[0]).style("text-anchor", "start").html("Wind (km/h)");
        plotBox.append("g").attr("class", "humidityY axis").call(leftHumidityYAxis).append("text").attr("transform", "rotate(-90)").attr("y", -35).attr("x", -humidityY.range()[0]).style("text-anchor", "start").html("Humidity (%)");
        rainLabel = plotBox.append("g").attr("class", "rightY axis").attr("transform", "translate(" + width + ",0)").call(rainYAxis).append("text").attr("transform", "rotate(-90)").attr("y", 50).attr("x", -rainY.range()[0]).style("text-anchor", "start");
        rainLabel.append("tspan").text("Rain (mm)");
        rainLabel.append("tspan").text("since 9am").attr("x", -rainY.range()[0]).attr("y", 65);
        plotBox.selectAll(".night").data(observations.nightsPerSite[0]).enter().append("rect").attr("x", function(d) {
          return x(d.start);
        }).attr("width", function(d) {
          return x(d.end) - x(d.start);
        }).attr("y", 0).attr("height", plotBoxHeight).attr("class", "night");
        site = plotBox.selectAll(".site").data(sites).enter().append("g").attr("class", "site");
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
        site.append("path").attr("class", "area windGust").style("fill", colorByName).datum(function(d) {
          return d.values;
        }).attr("d", windArea);
        site.append("path").attr("class", "line").attr("d", function(d) {
          return humidityLine(d.values);
        }).style("stroke", colorByName);
        site.append("text").datum(function(d) {
          return {
            name: d.name,
            value: d.values[0]
          };
        }).attr("transform", function(d) {
          return "translate(" + x(d.value.date) + "," + tempY(d.value.airTemp) + ")";
        }).attr("x", 3).attr("dy", ".35em").text(function(d) {
          return d.name;
        });
        plotBox.selectAll(".site").attr("opacity", 1).on("mouseover", function(d, i) {
          return plotBox.selectAll(".site").transition().duration(250).attr("opacity", function(d, j) {
            var _ref;
            return (_ref = j !== i) != null ? _ref : {
              0.6: 1
            };
          });
        }).on("mouseout", function() {
          return plotBox.selectAll(".site").transition().duration(250).attr("opacity", 1);
        });
        rainTraces = plotBox.selectAll(".rainTrace").data(rainTracePerSite).enter().append("g").attr("class", "rainTrace").attr("fill", colorByName).style("stroke", colorByName);
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
          return site.values[site.values.length - 1];
        });
        showToolTip(mostRecent[0].date, mostRecent.map(function(d) {
          return d.observation;
        }));
        return d3.selectAll(".tooltip,.explanation").style("visibility", "");
      };
      scope.$watch(attrs.bomPlot, function(v) {
        if (v) {
          return Observations.load(v).then(plot);
        }
      }, true);
      showMouseLine = function() {
        d3.select(".mouseLine").transition().duration(250).style("opacity", 0.5);
        return d3.selectAll(".mouseTip").transition().duration(250).style("opacity", 1);
      };
      hideMouseLine = function() {
        return d3.selectAll(".mouseLine,.mouseTip").transition().duration(400).style("opacity", 0);
      };
      moveMouseLine = function(mouseX) {
        var observed, time, translatedMouseX, xPos;
        translatedMouseX = mouseX - margin.left;
        if (sites && translatedMouseX > 0 && translatedMouseX < width) {
          xPos = (mouseX - 1) + "px";
          d3.select(".mouseLine").attr({
            x1: xPos,
            x2: xPos
          });
          time = x.invert(translatedMouseX);
          observed = sites.map(function(site) {
            return findObservationFor(site, time);
          });
          showToolTip(time, observed);
          return scope.$digest();
        }
      };
      return createMouseLine = function(svgRoot) {
        var chart;
        svgRoot.append("line").attr("class", "mouseLine").style("stroke", "black").style("opacity", "0").attr("x1", margin.left).attr("x2", margin.left).attr("y1", margin.top).attr("y2", plotBoxHeight + margin.top);
        chart = d3.select("svg");
        chart.on("mousemove", function() {
          return moveMouseLine(d3.mouse(this)[0]);
        }).on("mouseover", showMouseLine).on("mouseout", hideMouseLine).on("touchstart", function() {
          moveMouseLine(d3.touches(this)[0][0]);
          return showMouseLine();
        });
        return Hammer(document.querySelector("svg")).on("drag", function(event) {
          var position;
          event.gesture.preventDefault();
          position = d3.touches(chart[0][0], event.gesture.touches);
          return moveMouseLine(position[0][0]);
        });
      };
    }
  };
});

angular.module('desktop', ['bom.observations', 'bom.plot']).controller('DesktopController', function($scope, Preferences) {
  return $scope.stations = Preferences.load();
});
