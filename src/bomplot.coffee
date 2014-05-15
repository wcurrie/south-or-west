angular.module('bom.plot', ['bom.observations'])
.directive('bomPlot', (Observations) ->
  {
    link: (scope, element, attrs) ->
      findObservationFor = (site, date) ->
        reference = date.getTime()
        scored = site.values.map((d) ->
          {
            delta: Math.abs(reference - d.date.getTime()),
            observation: d.observation
          }
        )
        scored.sort (a, b) -> a.delta - b.delta
        scored[0].observation

      showValueAtMouselineIntersection = (now, observations, collisionGuard, attr, yScale, suffix) ->
        joinByName = (d) -> d.name
        xPos = x(now)
        yPos = (d) -> yScale.call(null, d[attr])
        clearOfRightYAxis = xPos < x.range()[1] - 40
        debounced = observations.filter((d) -> collisionGuard(yPos(d)))

        tipClassName = "tip-" + attr
        dotClassName = "dot" + attr
        plotBox = d3.select(".plotBox")

        airTips = plotBox
          .selectAll("text." + tipClassName)
          .data(debounced, joinByName)
        airTips
          .attr("x", xPos)
          .attr("y", yPos)
          .attr("dx", () -> if clearOfRightYAxis then 2 else -2)
          .style("text-anchor", () -> if clearOfRightYAxis then "start" else "end")
          .text((d) -> d[attr] + suffix)
        airTips.enter()
          .append("text")
          .attr("class", tipClassName + " mouseTip")
          .attr("dy", -2)
        airTips.exit().remove()

        airDots = plotBox
          .selectAll("." + dotClassName)
          .data(debounced, joinByName)
        airDots
          .attr("cx", xPos)
          .attr("cy", yPos)
        airDots.enter()
          .append("circle")
          .attr("class", dotClassName + " mouseTip")
          .attr("r", "2")
        airDots.exit().remove()

      showTimeAtTopOfMouseLine = (now) ->
        mouseTip = d3.select(".plotBox")
          .selectAll("text.mousedTime")
          .data([now], () -> 1)
        mouseTip
          .attr("x", x(now))
          .attr("y", 0)
          .text(mouseLineDateFormat(now))
        mouseTip.enter()
          .append("text")
          .attr("class", "mousedTime mouseTip")
          .attr("dy", -2)
          .attr("dx", 2)

      mouseLineDateFormat = d3.time.format("%a %H:%M")
      tooltipDateFormat = d3.time.format("%d %B %H:%M")

      showToolTip = (now, observations) ->
        scope.now = tooltipDateFormat(now)
        scope.currentObservations = observations

        usedYValues = []
        collisionGuard = (newY) ->
          collision = usedYValues.filter((y) -> Math.abs(y - newY) < 8).length > 0
          usedYValues.push(newY) unless collision
          !collision

        showValueAtMouselineIntersection(now, observations, collisionGuard, "air_temp", tempY, "\u00B0")
        showValueAtMouselineIntersection(now, observations, collisionGuard, "apparent_t", tempY, "\u00B0")
        showValueAtMouselineIntersection(now, observations, collisionGuard, "rel_hum", humidityY, "%")
        showValueAtMouselineIntersection(now, observations, collisionGuard, "wind_spd_kmh", windY, "")
        showValueAtMouselineIntersection(now, observations, collisionGuard, "gust_kmh", windY, "")
        showValueAtMouselineIntersection(now, observations, collisionGuard, "dewpt", tempY, "\u00B0")
        showTimeAtTopOfMouseLine(now)

      sites = undefined  # for mouse move

      attrOrDefault = (attr, d) -> if attrs[attr] then +attrs[attr] else d

      margin = {top: 20, right: 80, bottom: 30, left: 50, graphGap: attrOrDefault("gapHeight", 15)}
      width = 960 - margin.left - margin.right
      airHeight = attrOrDefault "airHeight", 450
      rainHeight = attrOrDefault "rainHeight", 100
      windHeight = attrOrDefault "windHeight", 100
      plotBoxHeight = (airHeight + rainHeight + windHeight) + margin.graphGap*2
      plotYRanges = [
        [airHeight, 0],
        [airHeight + margin.graphGap + windHeight, airHeight + margin.graphGap],
        [airHeight + margin.graphGap + windHeight + margin.graphGap + rainHeight, airHeight + margin.graphGap + windHeight + margin.graphGap]
      ]

      x = d3.time.scale()
        .range([0, width])
        .clamp(true)

      tempY = d3.scale.linear()
        .range(plotYRanges[0])

      windY = d3.scale.linear()
        .range(plotYRanges[1])
        .clamp(true)

      rainY = d3.scale.linear()
        .range(plotYRanges[2])
        .clamp(true)

      humidityY = d3.scale.linear()
        .range(plotYRanges[2])
        .domain([0, 100])
        .clamp(true)

      color = d3.scale.category10()

      xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

      leftTemperatureYAxis = d3.svg.axis()
        .scale(tempY)
        .orient("left")

      leftHumidityYAxis = d3.svg.axis()
        .scale(humidityY)
        .orient("left")
        .ticks(5)

      rainYAxis = d3.svg.axis()
        .scale(rainY)
        .orient("right")
        .ticks(5)

      windYAxis = d3.svg.axis()
        .scale(windY)
        .orient("right")
        .ticks(8)

      tempLine = d3.svg.line()
        .interpolate("basis")
        .x((d) -> x(d.date))
        .y((d) -> tempY(d.airTemp));

      dewPointLine = d3.svg.line()
        .interpolate("basis")
        .x((d) -> x(d.date))
        .y((d) -> tempY(d.observation.dewpt));

      windLine = d3.svg.line()
        .interpolate("basis")
        .x((d) -> x(d.date))
        .y((d) -> windY(d.observation.wind_spd_kmh));

      humidityLine = d3.svg.line()
        .interpolate("basis")
        .x((d) -> x(d.date))
        .y((d) -> humidityY(d.observation.rel_hum));

      tempArea = d3.svg.area()
        .x((d) -> x(d.date))
        .y0((d) -> tempY(d.apparentTemp))
        .y1((d) -> tempY(d.airTemp))

      windArea = d3.svg.area()
        .x((d) -> x(d.date))
        .y0((d) -> windY(d.observation.wind_spd_kmh))
        .y1((d) -> windY(d.observation.gust_kmh))

      plot = (data) ->
        plotBox = d3.select(".chart").select("svg").select("g")
        if plotBox.empty()
          svgRoot = d3.select(".chart").append("svg")
            .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (plotBoxHeight + margin.top + margin.bottom))

          plotBox = svgRoot
            .append("g")
            .attr("class", "plotBox")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

          createMouseLine(svgRoot);
        else
          plotBox.selectAll("*").remove()

        d3.select("#observations").selectAll("tr").remove()

        observations = new BomObservations(data)
        sites = observations.seriesPerSite
        rainTracePerSite = observations.rainTracesPerSite

        color.domain(sites.map((site) -> site.name))
        colorByName = (d) -> color(d.name)

        x.domain([
          d3.min(sites, (site) -> d3.min(site.values, (v) -> v.date)),
          d3.max(sites, (site) -> d3.max(site.values, (v) -> v.date))
        ])

        tempY.domain([
          d3.min(sites, (site) -> d3.min(site.values, (v) -> d3.min([v.airTemp, v.apparentTemp, v.observation.dewpt]))),
          d3.max(sites, (site) -> d3.max(site.values, (v) -> d3.max([v.airTemp, v.apparentTemp, v.observation.dewpt]))) + 1
        ])

        rainY.domain([
          0,
          Math.max(2, d3.max(rainTracePerSite, (site) -> d3.max(site.values, (v) -> v.rain)))
        ])

        windY.domain([
          0,
          d3.max(sites, (site) -> d3.max(site.values, (v) -> d3.max([v.observation.wind_spd_kmh, v.observation.gust_kmh])))
        ])

        plotBox.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + plotBoxHeight + ")")
          .call(xAxis)

        plotBox.append("g")
          .attr("class", "tempY axis")
          .call(leftTemperatureYAxis)
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -35)
          .style("text-anchor", "end")
          .html("Temperature (&deg;C)")

        plotBox.append("g")
          .attr("class", "rightY axis")
          .attr("transform", "translate(" + width + ",0)")
          .call(windYAxis)
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 50)
          .attr("x", -windY.range()[0])
          .style("text-anchor", "start")
          .html("Wind (km/h)")

        plotBox.append("g")
          .attr("class", "humidityY axis")
          .call(leftHumidityYAxis)
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -35)
          .attr("x", -humidityY.range()[0])
          .style("text-anchor", "start")
          .html("Humidity (%)")

        rainLabel = plotBox.append("g")
          .attr("class", "rightY axis")
          .attr("transform", "translate(" + width + ",0)")
          .call(rainYAxis)
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 50)
          .attr("x", -rainY.range()[0])
          .style("text-anchor", "start");
        rainLabel.append("tspan").text("Rain (mm)")
        rainLabel.append("tspan").text("since 9am").attr("x", -rainY.range()[0]).attr("y", 65)

        # TODO: vary night shading to follow site under cursor...
        plotBox.selectAll(".night")
          .data(observations.nightsPerSite[0])
          .enter()
          .append("rect")
          .attr("x", (d) -> x(d.start))
          .attr("width", (d) -> x(d.end) - x(d.start))
          .attr("y", 0)
          .attr("height", plotBoxHeight)
          .attr("class", "night")

        site = plotBox.selectAll(".site")
          .data(sites)
          .enter().append("g")
          .attr("class", "site")

        site.append("path")
          .attr("class", "line")
          .attr("d", (d) -> tempLine(d.values))
          .style("stroke", colorByName)

        site.append("path")
          .attr("class", "area")
          .style("fill", colorByName)
          .datum((d) -> d.values)
          .attr("d", tempArea)

        site.append("path")
          .attr("class", "dewPointLine")
          .attr("d", (d) -> dewPointLine(d.values))
          .style("stroke", colorByName)

        site.append("path")
          .attr("class", "line")
          .attr("d", (d) -> windLine(d.values))
          .style("stroke", colorByName)

        site.append("path")
          .attr("class", "area windGust")
          .style("fill", colorByName)
          .datum((d) -> d.values)
          .attr("d", windArea)

        site.append("path")
          .attr("class", "line")
          .attr("d", (d) -> humidityLine(d.values))
          .style("stroke", colorByName)

        site.append("text")
          .datum((d) -> {name: d.name, value: d.values[0]})
          .attr("transform", (d) -> "translate(" + x(d.value.date) + "," + tempY(d.value.airTemp) + ")")
          .attr("x", 3)
          .attr("dy", ".35em")
          .text((d) -> d.name)

        plotBox.selectAll(".site")
          .attr("opacity", 1)
          .on("mouseover", (d, i) ->
            plotBox.selectAll(".site").transition()
              .duration(250)
              .attr("opacity", (d, j) -> j != i ? 0.6 : 1)
          ).on("mouseout", () ->
            plotBox.selectAll(".site").transition()
              .duration(250)
              .attr("opacity", 1)
          )

        rainTraces = plotBox.selectAll(".rainTrace")
          .data(rainTracePerSite)
          .enter().append("g")
            .attr("class", "rainTrace")
            .attr("fill", colorByName)
            .style("stroke", colorByName)

        buckets = rainTraces.selectAll("rect")
          .data((d) -> d.values)
          .enter()

        buckets.append("rect")
          .attr("x", (d) -> x(d.start))
          .attr("y", (d) -> rainY(d.rain))
          .attr("width", (d) -> x(d.end) - x(d.start))
          .attr("height", (d) -> rainY.range()[0] - rainY(d.rain))

        buckets.append("line")
          .attr("x1", (d) -> x(d.start))
          .attr("x2", (d) -> x(d.end))
          .attr("y1", (d) -> rainY(d.rain))
          .attr("y2", (d) -> rainY(d.rain))

        mostRecent = sites.map((site) -> site.values[site.values.length-1])
        showToolTip(mostRecent[0].date, mostRecent.map((d) -> d.observation))

        d3.selectAll(".tooltip,.explanation").style("visibility", "")

      scope.$watch(attrs.bomPlot, (v) ->
        if v
          Observations.load(v).then(plot)
      , true)

      showMouseLine = () ->
        d3.select(".mouseLine").transition().duration(250).style("opacity", 0.5)
        d3.selectAll(".mouseTip").transition().duration(250).style("opacity", 1)

      hideMouseLine = () ->
        d3.selectAll(".mouseLine,.mouseTip").transition().duration(400).style("opacity", 0)

      moveMouseLine = (mouseX) ->
        translatedMouseX = mouseX - margin.left
        if sites and translatedMouseX > 0 and translatedMouseX < width
          xPos = (mouseX - 1) + "px"
          d3.select(".mouseLine")
            .attr({x1: xPos, x2: xPos})
          time = x.invert(translatedMouseX)
          observed = sites.map((site) -> findObservationFor(site, time))
          showToolTip(time, observed)
          scope.$digest()

      createMouseLine = (svgRoot) ->
        svgRoot.append("line")
          .attr("class", "mouseLine")
          .style("stroke", "black")
          .style("opacity", "0")
          .attr("x1", margin.left)
          .attr("x2", margin.left)
          .attr("y1", margin.top)
          .attr("y2", plotBoxHeight + margin.top)

        chart = d3.select("svg")
        chart
          .on("mousemove", () ->
            moveMouseLine(d3.mouse(this)[0])
          )
          .on("mouseover", showMouseLine)
          .on("mouseout", hideMouseLine)
          .on("touchstart", () ->
            moveMouseLine(d3.touches(this)[0][0])
            showMouseLine()
          )

        Hammer(document.querySelector("svg"))
          .on("drag", (event) ->
            event.gesture.preventDefault()
            position = d3.touches(chart[0][0], event.gesture.touches)
            moveMouseLine(position[0][0])
        )
  }
)
