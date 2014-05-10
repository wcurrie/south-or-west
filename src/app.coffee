
stations = [
  {name: "Nowra", url: "IDN60801/IDN60801.94750", load: false},
  {name: "Mt Boyce", url: "IDN60801/IDN60801.94743", load: false},
  {name: "Sydney (Observatory Hill)", url: "IDN60901/IDN60901.94768", load: false},
  {name: "Horsham", url: "IDV60801/IDV60801.95839", load: false},
  {name: "Canberra", url: "IDN60903/IDN60903.94926", load: false}
]

loadJson = (url) ->
  new Promise (resolve, reject) ->
    d3.json url, (error, data) ->
      if error
        reject error
      else
        resolve data

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

showValueAtMouselineIntersection = (now, observations, attr, yScale, suffix) ->
  joinByName = (d) -> d.name
  xPos = x(now)
  yPos = (d) -> yScale.call(null, d[attr])
  yValues = []

  debounced = observations.filter((d) ->
    newY = yPos(d)
    collision = yValues.filter((y) -> Math.abs(y - newY) < 6).length > 0
    yValues.push(newY) unless collision
    !collision
  )

  tipClassName = "tip-" + attr
  dotClassName = "dot" + attr
  plotBox = d3.select(".plotBox")

  airTips = plotBox
    .selectAll("text." + tipClassName)
    .data(debounced, joinByName)
  airTips
    .attr("x", xPos)
    .attr("y", yPos)
    .attr("dx", () -> if xPos < x.range()[1] - 25 then 2 else -20)
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
    .text(tooltipDateFormat(now))
  mouseTip.enter()
    .append("text")
    .attr("class", "mousedTime mouseTip")
    .attr("dy", -2)
    .attr("dx", 2)

tooltipDateFormat = d3.time.format("%d %B %H:%M")

showToolTip = (now, observations) ->
  document.getElementById("time").textContent = tooltipDateFormat(now)

  rows = d3.select("#observations")
    .selectAll("tr")
    .data(observations)

  row = rows
    .enter()
    .append("tr")

  row.append("td").attr("class", "name")
  row.append("td").attr("class", "airTemp")
  row.append("td").attr("class", "apparentTemp")
  row.append("td").attr("class", "humidity")
  row.append("td").attr("class", "wind")
  row.append("td").attr("class", "rain")

  rows.select(".name").text((d) -> d.name)
  rows.select(".airTemp").text((d) -> d.air_temp)
  rows.select(".apparentTemp").text((d) -> d.apparent_t)
  rows.select(".humidity").text((d) -> d.rel_hum)
  rows.select(".wind").text((d) -> d.wind_spd_kmh)
  rows.select(".rain").text((d) -> d.rain_trace)

  showValueAtMouselineIntersection(now, observations, "air_temp", tempY, "\u00B0")
  showValueAtMouselineIntersection(now, observations, "apparent_t", tempY, "\u00B0")
  showValueAtMouselineIntersection(now, observations, "rel_hum", humidityY, "%")
  showValueAtMouselineIntersection(now, observations, "wind_spd_kmh", windY, "km/h")
  showValueAtMouselineIntersection(now, observations, "gust_kmh", windY, "km/h")
  showValueAtMouselineIntersection(now, observations, "dewpt", tempY, "\u00B0")
  showTimeAtTopOfMouseLine(now)

sites = undefined  # for mouse move
load = () ->
  urls = stations.filter((s) -> s.load).map((s) -> "/fwo/" + s.url + ".json")
  Promise.all(urls.map(loadJson))

margin = {top: 20, right: 80, bottom: 30, left: 50, graphGap: 10}
width = 960 - margin.left - margin.right
plotBoxHeight = 650 + margin.graphGap*2
airHeight = 450
rainHeight = 100
windHeight = 100
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

svg = d3.select(".chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", plotBoxHeight + margin.top + margin.bottom)
  .append("g")
  .attr("class", "plotBox")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

plot = (data) ->
  svg.selectAll("*").remove()
  d3.select("#observations").selectAll("tr").remove()

  sites = extractSeriesPerSite(data)
  rainTracePerSite = extractRainTracePerSite(sites)
  nights = nightsPerSite(data)

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

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + plotBoxHeight + ")")
    .call(xAxis)

  svg.append("g")
    .attr("class", "tempY axis")
    .call(leftTemperatureYAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -25)
    .style("text-anchor", "end")
    .html("Temperature (&deg;C)")

  svg.append("g")
    .attr("class", "rightY axis")
    .attr("transform", "translate(" + width + ",0)")
    .call(windYAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 50)
    .attr("x", -windY.range()[0])
    .style("text-anchor", "start")
    .html("Wind (km/h)")

  svg.append("g")
    .attr("class", "humidityY axis")
    .call(leftHumidityYAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -35)
    .attr("x", -humidityY.range()[0])
    .style("text-anchor", "start")
    .html("Humidity (%)")

  svg.append("g")
    .attr("class", "rightY axis")
    .attr("transform", "translate(" + width + ",0)")
    .call(rainYAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 50)
    .attr("x", -rainY.range()[0])
    .style("text-anchor", "start")
    .html("Rain since 9am (mm)")

  # TODO: vary night shading to follow site under cursor...
  svg.selectAll(".night")
    .data(nights[0])
    .enter()
    .append("rect")
    .attr("x", (d) -> x(d.start))
    .attr("width", (d) -> x(d.end) - x(d.start))
    .attr("y", 0)
    .attr("height", plotBoxHeight)
    .attr("class", "night")

  site = svg.selectAll(".site")
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
    .datum((d) -> {name: d.name, value: d.values[d.values.length - 1]})
    .attr("transform", (d) -> "translate(" + x(d.value.date) + "," + tempY(d.value.airTemp) + ")")
    .attr("x", 3)
    .attr("dy", ".35em")
    .text((d) -> d.name)

  site.append("text")
    .datum((d) -> {name: d.name, value: d.values[d.values.length - 1]})
    .attr("transform", (d) -> "translate(" + x(d.value.date) + "," + tempY(d.value.observation.dewpt) + ")")
    .attr("x", 3)
    .attr("dy", ".35em")
    .text("Dew Point")
    .attr("class", "mouseTip")
    .style("opacity", 0)

  svg.selectAll(".site")
    .attr("opacity", 1)
    .on("mouseover", (d, i) ->
      svg.selectAll(".site").transition()
        .duration(250)
        .attr("opacity", (d, j) -> j != i ? 0.6 : 1)
    ).on("mouseout", () ->
      svg.selectAll(".site").transition()
        .duration(250)
        .attr("opacity", 1)
    )

  rainTraces = svg.selectAll(".rainTrace")
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

  mostRecent = sites.map((site) -> site.values[site.values.length-1].observation)
  showToolTip(parseDate(mostRecent[0].local_date_time_full), mostRecent)

  d3.selectAll(".tooltip,.explanation,.disclaimer").style("visibility", "")

loadThenPlot = () ->
  load().then(plot).catch((error) ->
    console.error(error)
    console.log(error.stack)
  )

verticalMouseLine = d3.select(".chart")
  .append("div")
  .attr("class", "mouseLine")
  .style("position", "absolute")
  .style("z-index", "19")
  .style("width", "1px")
  .style("height", plotBoxHeight + "px")
  .style("top", "32px")
  .style("bottom", "30px")
  .style("left", "0px")
  .style("background", "#000")
  .style("opacity", "0")

d3.select(".chart")
  .on("mousemove", () ->
    mouseX = d3.mouse(this)[0]
    translatedMouseX = mouseX - margin.left
    if sites and translatedMouseX > 0 and translatedMouseX < width
      verticalMouseLine.style("left", (mouseX + 7) + "px")
      time = x.invert(translatedMouseX)
      observed = sites.map((site) -> findObservationFor(site, time))
      showToolTip(time, observed)
  ).on("mouseover", () ->
    d3.select(".mouseLine").transition().duration(250).style("opacity", 0.5)
    d3.selectAll(".mouseTip").transition().duration(250).style("opacity", 1)
  ).on("mouseout", () ->
    d3.selectAll(".mouseLine,.mouseTip").transition().duration(400).style("opacity", 0)
  )

showStationList = () ->
  lis = d3.select("#source-list")
    .selectAll("li")
    .data(stations)
    .enter()
    .append("li")
  lis.append("input")
    .attr("type", "checkbox")
    .attr("onclick", (d) -> "toggleStation('" + d.name + "')")
    .attr("id", (d) -> "show-" + d.name)
  lis.append("a")
    .attr("href", (d) -> "http://www.bom.gov.au/products/" + d.url + ".shtml")
    .text((d) -> d.name)
  if localStorage
    savedStations = localStorage.getItem("stations")
    for s in JSON.parse(savedStations || '["Nowra", "Mt Boyce"]')
      stations.filter((d) -> d.name == s)[0].load = true
      document.getElementById("show-" + s).checked = true

saveStations = () ->
  if localStorage
    localStorage.setItem("stations", JSON.stringify(stations.filter((d) -> d.load).map((d) -> d.name)))

toggleStation = (name) ->
  station = stations.filter((s) -> s.name == name)[0]
  station.load = !station.load
  saveStations()
  loadThenPlot()

showStationList()
loadThenPlot()

parseDate = d3.time.format("%Y%m%d%H%M%S").parse

###
  Crunching data. Probably best moved to server side...
###

nightsPerSite = (sites) ->
  parseDay = d3.time.format("%Y%m%d").parse

  sites.map((site) ->
    lat = 0
    lon = 0
    dates = d3.set()

    site.observations.data.forEach((d) ->
      dates.add(d.local_date_time_full.substr(0, 8))
      lat = d.lat
      lon = d.lon
    )

    timesPerDay = dates.values().sort(d3.ascending).map((d) ->
      times = SunCalc.getTimes(parseDay(d), lat, lon)
      { up: times.sunrise, down: times.sunset }
    )

    startOfTime = new Date(0)
    endOfTime = new Date(Math.pow(2, 32) * 1000)

    nights = [{ start: startOfTime, end: timesPerDay[0].up } ]

    timesPerDay.forEach((t, i) ->
      nights.push({
        start: t.down,
        end: if i+1 < timesPerDay.length then timesPerDay[i+1].up else endOfTime
      })
    )
    nights
  )

extractSeriesPerSite = (data) ->
  ascendingByDate = (d1, d2) -> d3.ascending(d1.date.getTime(), d2.date.getTime())
  data.map (site) ->
    {
    name: site.observations.header[0].name,
    values: site.observations.data.map((d) ->
      {
      date: parseDate(d.local_date_time_full),
      airTemp: d.air_temp,
      apparentTemp: d.apparent_t,
      observation: d
      }
    ).sort(ascendingByDate)
    }

extractRainTracePerSite = (sites) ->
  startOfTime = new Date(0)
  endOfTime = new Date(Math.pow(2, 32) * 1000)

  sites.map((site) ->
    values = site.values.map((d, i, values) ->
      {
      start: if i == 0 then startOfTime else d.date,
      end: if i+1 < values.length then values[i+1].date else endOfTime,
      rain: parseFloat(d.observation.rain_trace)
      }
    ).filter((v) -> v.rain > 0)
    { name: site.name, values: values }
  )