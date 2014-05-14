BomStations = [
  {name: "Nowra", url: "IDN60801/IDN60801.94750", load: false},
  {name: "Mt Boyce", url: "IDN60801/IDN60801.94743", load: false},
  {name: "Sydney (Observatory Hill)", url: "IDN60901/IDN60901.94768", load: false},
  {name: "Horsham", url: "IDV60801/IDV60801.95839", load: false},
  {name: "Canberra", url: "IDN60903/IDN60903.94926", load: false}
]

class BomObservations
  constructor: (@dataPerSite) ->
    @seriesPerSite = this.extractSeriesPerSite(@dataPerSite)
    @rainTracesPerSite = this.extractRainTracePerSite(@seriesPerSite)
    @nightsPerSite = this.extractNightsPerSite(@dataPerSite)

  ###
    Crunching data. Probably best moved to server side... a
  ###

  extractNightsPerSite: (sites) ->
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

  extractSeriesPerSite: (data) ->
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

  extractRainTracePerSite: (sites) ->
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