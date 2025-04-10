import ApexCharts from "apexcharts";

// ----------------------------------------------------------------------------------------
// Global Variables & URL Params
// ----------------------------------------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
console.log(id); // Outputs: "Foo Bar"

// Global settings and state variables
const token = "23b30428c4102a9280abbbd75762cf01";
const priceHistory = []; // Price history (up to 20 points)
const maxDataPoints = 20;

let chart, volumeChart;
let currentCandleCount = 0;
let currentVolumeCount = 0;
let currentChartData = [];
let drawnLines = [];
let drawingMode = false;
let alertDrawingMode = false;
let newsMode = false;
let fetchedNews = null;
let currentXMin = null,
  currentXMax = null,
  currentYMin = null,
  currentYMax = null;
let macdlastsignal = 0;
let activeMarkets = [];
let currentMarketId = id;
let firstCandleTime = null;
let time_interval_for_chart = 5000; // May update based on API response


const modal = document.getElementById('news-modal');
const closeBtn = document.getElementById('close-modal-btn');

closeBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Optional: click outside to close
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

const infoBtn = document.getElementById('info-btn');
const infoPopup = document.getElementById('info-popup');

infoBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  infoPopup.classList.toggle('hidden');
});

// Optional: close popup if clicking elsewhere
document.addEventListener('click', () => {
  infoPopup.classList.add('hidden');
});


// ----------------------------------------------------------------------------------------
// Fetch Coin Data & Update Data Cards / Price History
// ----------------------------------------------------------------------------------------


async function fetchNewsall(firstCandleTime) {

  try {
    let params = {
      symbols: "ETH-USDT",
      startDate: firstCandleTime,
      category: "cryptocurrencies"
    };
    let newsResponse = await axios.post(
      "http://79.175.177.113:15800/AimoonxNewsHUB/News/GetNewsbyDateCategory/",
      params,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          Authorization: '189b4bf96bf5de782515c1b4f0b2a2c7',
        },
      }
    );
    if (newsResponse.data && newsResponse.data.return) {
      console.log(fetchedNews);

      fetchedNews = newsResponse.data.data;
    }
  } catch (err) {
    console.error("Error fetching news:", err);
  }
}

// ----------------------------------------------------------------------------------------
// Fetch Coin Data & Update Data Cards / Price History
// ----------------------------------------------------------------------------------------
async function fetchCoinList() {
  const url = "http://188.34.202.221:8000/Market/GetMarketPair/";
  const params = { marketpair_id: id };

  try {
    axios
      .post(url, params, {
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      })
      .then((response) => {
        const data = response.data.market_pair;
        if (data) {
          // Update data cards
          document.getElementById("pairName").textContent = data.pair.name;
          document.getElementById("price").textContent = data.formatted_price;
          document.getElementById("askPrice").textContent = data.ask_price;
          document.getElementById("bidPrice").textContent = data.bid_price;
          document.getElementById("volume").textContent =
            parseFloat(data.volume).toFixed(2);
          document.getElementById("changePrice").textContent = data.change_price;
          document.getElementById("changeRate").textContent = data.change_rate;
          if (data.pair.src) {
            document.getElementById("srcCoinName").textContent = `${data.pair.src.name} (${data.pair.src.symbol})`;
            document.getElementById("srcLogo").src = data.pair.src.logo_url;
          }
          if (data.pair.base) {
            document.getElementById("baseCoinName").textContent = `${data.pair.base.name} (${data.pair.base.symbol})`;
            document.getElementById("baseLogo").src = data.pair.base.logo_url;
          }
          document.getElementById("openPrice").textContent = data.open_price;
          document.getElementById("closePrice").textContent = data.close_price;
          document.getElementById("highPrice").textContent = data.high_price;
          document.getElementById("lowPrice").textContent = data.low_price;

          // Update price history for charting
          const currentPrice = parseFloat(data.price);
          const currentTime = new Date();
          priceHistory.push({ time: currentTime, price: currentPrice });
          if (priceHistory.length > maxDataPoints) {
            priceHistory.shift();
          }
        }
      })
      .catch((error) => {
        console.error("Error making request:", error);
      });
  } catch (error) {
    console.error("Error fetching coin list:", error);
  }
}
fetchCoinList();
setInterval(fetchCoinList, time_interval_for_chart);
// setInterval(fetchNewsall, time_interval_for_chart);


// ----------------------------------------------------------------------------------------
// Active Markets & Market Select Dropdown Helpers
// ----------------------------------------------------------------------------------------
async function fetchActiveMarkets() {
  try {
    const response = await axios.get("http://188.34.202.221:8000/Pair/ListPairs/", {
      headers: {
        Accept: "application/json",
        Authorization: token,
      },
    });
    if (response.data.return) {
      activeMarkets = response.data.pairs;
      // Optionally call populateMarketSelect() here
    }
  } catch (error) {
    console.error("Error fetching active markets:", error);
  }
}

function populateMarketSelect() {
  const select = document.getElementById("marketSelect");
  select.innerHTML = "";
  activeMarkets.forEach((market) => {
    const option = document.createElement("option");
    option.value = market.id;
    option.textContent = market.name;
    if (market.id == id) {
      option.selected = "true";
      currentMarketId = market.id;
      updateMarketInfo(market);
    }
    select.appendChild(option);
  });
}

function updateMarketInfo(market) {
  document.getElementById("marketName").textContent = market.name;
  document.getElementById("marketDesc").textContent = market.desc || "";
}

// ----------------------------------------------------------------------------------------
// Fetch OHLCV Data and Process it for the Candlestick & Volume Charts
// ----------------------------------------------------------------------------------------
async function fetchOHLCVData() {
  const marketpair_id = currentMarketId;
  console.log(marketpair_id);
  const timeframe = document.getElementById("timeframe").value;
  const limit = parseInt(document.getElementById("limit").value);
  const since = getDate(limit, timeframe);
  let chart_type = document.getElementById("chart_type").checked;
  let url = chart_type
    ? "http://188.34.202.221:8000/Market/exGetTrendWithOHLCV/"
    : "http://188.34.202.221:8000/Market/exGetOHLCV/";
  if (chart_type) {
    document.getElementById("advanced_chart_tools").classList.remove("hidden");
  } else {
    document.getElementById("advanced_chart_tools").classList.add("hidden");
  }

  try {
    const response = await axios.post(
      url,
      { marketpair_id, timeframe, since, limit },
      {
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      }
    );


    if (response.data.return) {
      let ohlcv = chart_type ? response.data.data : response.data.ohlcv;
      firstCandleTime = Math.floor(new Date(ohlcv[0].datetime).getTime() / 1000);
      if (newsMode) {
        console.log("on");

        await fetchNewsall(firstCandleTime)
      }
      // time_interval_for_chart = 10000;
      return ohlcv;
    }
  } catch (error) {
    console.error("Error fetching OHLCV data:", error);
  }
}

// ----------------------------------------------------------------------------------------
// Annotation and News Modal Helper Functions
// ----------------------------------------------------------------------------------------
function getAnnotations(data) {
  let annotations = [];
  try {
    drawnLines.forEach((line, index) => {
      annotations.push({
        y: line.price,
        borderColor: line.alertOn ? "orange" : "gray",
        label: {
          borderColor: line.alertOn ? "orange" : "gray",
          style: { color: "#fff", background: line.alertOn ? "orange" : "gray" },
          text: `Line ${index + 1}`,
        },
      });
    });
    const srToggle = document.getElementById("show-support-resistance");
    if (srToggle && srToggle.checked && data.length > 0) {
      let lastCandle = data[data.length - 1];
      const srLevels = [
        { label: "S1", value: lastCandle.S1 },
        { label: "S2", value: lastCandle.S2 },
        { label: "S3", value: lastCandle.S3 },
        { label: "R1", value: lastCandle.R1 },
        { label: "R2", value: lastCandle.R2 },
        { label: "R3", value: lastCandle.R3 },
      ];
      srLevels.forEach((item) => {
        if (item.value != null) {
          annotations.push({
            y: item.value,
            borderColor: "rgba(255,0,0,0.3)",
            label: {
              borderColor: "rgba(255,0,0,0.3)",
              style: { color: "#fff", background: "rgba(255,0,0,0.3)" },
              text: item.label,
              position: "left",
            },
          });
        }
      });
    }
    const fibToggle = document.getElementById("show-fib");
    if (fibToggle && fibToggle.checked && data.length > 0) {
      let lastCandle = data[data.length - 1];
      const fibLevels = [
        { label: "FIB_S3", value: lastCandle.FIB_S3 },
        { label: "FIB_S2", value: lastCandle.FIB_S2 },
        { label: "FIB_S1", value: lastCandle.FIB_S1 },
        { label: "FIB_PP", value: lastCandle.FIB_PP },
        { label: "FIB_R1", value: lastCandle.FIB_R1 },
        { label: "FIB_R2", value: lastCandle.FIB_R2 },
        { label: "FIB_R3", value: lastCandle.FIB_R3 },
      ];
      fibLevels.forEach((item) => {
        if (item.value != null) {
          annotations.push({
            y: item.value,
            borderColor: "lightblue",
            label: {
              borderColor: "lightblue",
              style: { color: "#fff", background: "lightblue" },
              text: item.label,
              position: "left",
            },
          });
        }
      });
    }
  } catch (err) {
    console.error("Error in getAnnotations:", err);
  }
  return annotations;
}

async function updateAnnotationsWrapper(data) {
  try {
    const ann = { yaxis: getAnnotations(data) };
    chart.updateOptions({ annotations: ann });
  } catch (err) {
    console.error("Error updating annotations:", err);
  }
}

// ----------------------------------------------------------------------------------------
// Main Chart Update Function with Optimized Data Append
// ----------------------------------------------------------------------------------------
async function updateChart() {
  try {
    const data = await fetchOHLCVData();
    console.log(data);
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("No OHLCV data available.");
      return;
    }
    currentChartData = data; // Save data for tooltips

    // Reset zoom state if candle count changes
    if (data.length !== currentCandleCount) {
      currentXMin = currentXMax = currentYMin = currentYMax = null;
    }

    // Calculate extra x-axis spacing
    const candlestickData = data.map((d) => ({
      x: new Date(d.datetime),
      y: [d.open, d.high, d.low, d.close],
    }));
    let bullishColor = document.getElementById("bullish-color")
      ? document.getElementById("bullish-color").value
      : "#008000";
    let bearishColor = document.getElementById("bearish-color")
      ? document.getElementById("bearish-color").value
      : "#ff0000";
    const volumeData = data.map((d) => ({
      x: new Date(d.datetime),
      y: d.volume,
      fillColor: d.close > d.open ? bullishColor : bearishColor,
    }));

    let newXMax = null;
    if (candlestickData.length >= 2) {
      const lastTime = candlestickData[candlestickData.length - 1].x.getTime();
      const secondLastTime = candlestickData[candlestickData.length - 2].x.getTime();
      const diff = lastTime - secondLastTime;
      newXMax = lastTime + diff * 5;
    }

    // Build series array with optional SMA/EMA if toggled
    const series = [
      { name: "Candlestick", type: "candlestick", data: candlestickData },
    ];
    const smaToggle = document.getElementById("show-sma");
    if (smaToggle && smaToggle.checked) {
      const smaData = [];
      for (let i = 19; i < data.length; i++) {
        smaData.push({ x: new Date(data[i].datetime), y: data[i].SMA_20 });
      }
      series.push({ name: "SMA_20", type: "line", data: smaData });
    }
    const emaToggle = document.getElementById("show-ema");
    if (emaToggle && emaToggle.checked) {
      const emaData = [];
      for (let i = 19; i < data.length; i++) {
        emaData.push({ x: new Date(data[i].datetime), y: data[i].EMA_20 });
      }
      series.push({ name: "EMA_20", type: "line", data: emaData });
    }

    // Use optimized "appendData" if only one new point is added;
    // otherwise update the entire series.
    const isCandlestickIncremental =
      chart &&
      currentCandleCount &&
      candlestickData.length === currentCandleCount + 1;
    if (isCandlestickIncremental) {
      chart.appendData({
        seriesIndex: 0,
        data: [candlestickData[candlestickData.length - 1]],
      });
      if (smaToggle && smaToggle.checked) {
        const smaSeriesIndex = series.findIndex((s) => s.name === "SMA_20");
        if (smaSeriesIndex > -1) {
          chart.appendData({
            seriesIndex: smaSeriesIndex,
            data: [
              {
                x: new Date(data[data.length - 1].datetime),
                y: data[data.length - 1].SMA_20,
              },
            ],
          });
        }
      }
      if (emaToggle && emaToggle.checked) {
        const emaSeriesIndex = series.findIndex((s) => s.name === "EMA_20");
        if (emaSeriesIndex > -1) {
          chart.appendData({
            seriesIndex: emaSeriesIndex,
            data: [
              {
                x: new Date(data[data.length - 1].datetime),
                y: data[data.length - 1].EMA_20,
              },
            ],
          });
        }
      }
      currentCandleCount = candlestickData.length;
    } else {
      chart.updateSeries(series, true).catch((err) =>
        console.error("Error in full series update:", err)
      );
      currentCandleCount = candlestickData.length;
    }

    // Volume chart update with similar incremental logic:
    const isVolumeIncremental =
      volumeChart &&
      currentVolumeCount &&
      volumeData.length === currentVolumeCount + 1;
    if (isVolumeIncremental) {
      volumeChart.appendData({
        seriesIndex: 0,
        data: [volumeData[volumeData.length - 1]],
      });
      currentVolumeCount = volumeData.length;
    } else {
      volumeChart
        .updateSeries([{ name: "Volume", type: "bar", data: volumeData }], true)
        .catch((err) =>
          console.error("Error updating volume chart:", err)
        );
      currentVolumeCount = volumeData.length;
    }

    // ------------------------------------------------------------------------------------
    // Tooltip Options based on News Mode
    // ------------------------------------------------------------------------------------
    const tooltipOptions = newsMode
      ? {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          let candleTime = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
          let timeRange = 3600000;
          if (w.globals.seriesX[seriesIndex].length >= 2 && dataPointIndex > 0) {
            let prevTime = new Date(w.globals.seriesX[seriesIndex][dataPointIndex - 1]).getTime();
            let currTime = candleTime.getTime();
            timeRange = currTime - prevTime;
          }
          const relatedNews = fetchedNews
            ? fetchedNews.filter((news) => {
              let newsTime = news.pubDate * 1000;
              return (
                newsTime >= candleTime.getTime() &&
                newsTime < candleTime.getTime() + timeRange
              );
            })
            : [];
          return relatedNews.length > 0
            ? `<div class="p-2"><strong>${relatedNews[0].title}</strong></div>`
            : `<div class="p-2">No news available</div>`;
        },
      }
      : {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          if (!currentChartData || !currentChartData[dataPointIndex]) {
            return `<div class="apexcharts-tooltip">Loading...</div>`;
          }
          const item = currentChartData[dataPointIndex];
          const dateStr = new Date(item.datetime).toLocaleString();
          return `<div class="apexcharts-tooltip" style="padding:10px;">
                      <div><strong>${dateStr}</strong></div>
                      <div>Open: ${item.open}</div>
                      <div>High: ${item.high}</div>
                      <div>Low: ${item.low}</div>
                      <div>Close: ${item.close}</div>
                      <div>Volume: ${item.volume}</div>
                    </div>`;
        },
        shared: true,
        intersect: false,
      };

    // ------------------------------------------------------------------------------------
    // Update Chart Options (zoom, annotations, etc.)
    // ------------------------------------------------------------------------------------
    const newOptions = {
      chart: {
        noData: { text: "Loading..." },
        group: "news_charts",
        animations: { enabled: true },
        toolbar: { autoSelected: "pan" },
        zoom: { enabled: true, type: "xy" },
        id: "candlestick-chart",
        events: {
          zoomed: function (chartContext, { xaxis, yaxis }) {
            currentXMin = xaxis.min;
            currentXMax = xaxis.max;
            currentYMin = yaxis.min;
            currentYMax = yaxis.max;
          },
          click: function (event, chartContext, config) {
            if (newsMode) {
              try {
                const candleIndex = config.dataPointIndex;
                if (candleIndex >= 0 && data && data[candleIndex]) {
                  const candleTime = new Date(data[candleIndex].datetime);
                  let timeRange = 3600000;
                  if (data.length >= 2 && candleIndex > 0) {
                    const prevTime = new Date(data[candleIndex - 1].datetime).getTime();
                    const currTime = candleTime.getTime();
                    timeRange = currTime - prevTime;
                  }
                  const relatedNews = fetchedNews
                    ? fetchedNews.filter((news) => {
                      let newsTime = news.pubDate * 1000;
                      return (
                        newsTime >= candleTime.getTime() &&
                        newsTime < candleTime.getTime() + timeRange
                      );
                    })
                    : [];

                  showNewsModal(relatedNews);
                }
              } catch (err) {
                console.error("Error during news mode click event:", err);
              }
              return;
            }
            if (drawingMode || alertDrawingMode) {
              try {
                const globals = chartContext.w.globals;
                const offsetY = event.offsetY;
                const gridHeight = globals.gridHeight;
                if (!gridHeight) return;
                const minY = globals.minY;
                const maxY = globals.maxY;
                const gridSpacing = 5;
                const extraPoints = gridSpacing + 2;
                const price =
                  Math.round((maxY - (offsetY / gridHeight) * (maxY - minY)) * 100) / 100 + extraPoints;
                const alertOn = alertDrawingMode;
                drawnLines.push({ price, alertOn, alertTriggered: false });
                updateAnnotationsWrapper(data);
              } catch (err) {
                console.error("Error during drawing click event:", err);
              }
            }
          },
        },
      },
      plotOptions: {
        candlestick: {
          colors: { upward: bullishColor, downward: bearishColor },
        },
      },
      xaxis: {
        type: "datetime",
        min: currentXMin,
        max: newXMax || currentXMax,
      },
      yaxis: {
        tooltip: { enabled: true },
        opposite: true,
        min: currentYMin,
        max: currentYMax,
      },
      annotations: { yaxis: getAnnotations(data) },
      tooltip: tooltipOptions,
    };

    chart.updateOptions(newOptions).catch((err) =>
      console.error("Error updating chart options:", err)
    );

    // ------------------------------------------------------------------------------------
    // Update Trend, MACD, and Price Info Display
    // ------------------------------------------------------------------------------------
    const lastCandle = data[data.length - 1];
    const macdSignal = lastCandle.MACD_signal == lastCandle.MACD;
    if (macdSignal) {
      macdlastsignal = lastCandle.MACD_signal;
    } else if (macdlastsignal === 0) {
      document.getElementById("macd-recommendation").innerText = "Waiting ...";
    } else if (macdlastsignal > lastCandle.MACD_signal) {
      document.getElementById("macd-recommendation").innerText = "BUY";
    } else {
      document.getElementById("macd-recommendation").innerText = "SELL";
    }
    const currentPrice = lastCandle.close;
    const currentPriceColor = lastCandle.close > lastCandle.open ? bullishColor : bearishColor;
    if (document.getElementById("trend-recommendation")) {
      document.getElementById("trend-recommendation").innerText =
        lastCandle.TREND_RECOMMENDATION || "N/A";
    }
    if (document.getElementById("trend-strength")) {
      document.getElementById("trend-strength").innerText =
        lastCandle.TREND_STRENGTH !== undefined ? lastCandle.TREND_STRENGTH : "N/A";
    }
    if (document.getElementById("current-price")) {
      document.getElementById("current-price").innerHTML = `<span style="color:${currentPriceColor}; font-weight:bold;">${currentPrice.toFixed(2)}</span>`;
    }
  } catch (err) {
    console.error("Error in updateChart function:", err);
  }
}

// ----------------------------------------------------------------------------------------
// Initial Chart Options
// ----------------------------------------------------------------------------------------
const chartOptions = {
  chart: {
    noData: { text: "Loading..." },
    group: "news_charts",
    type: "candlestick",
    height: 600,
    animations: { enabled: true },
    zoom: { enabled: true, type: "xy" },
    id: "candlestick-chart",
    toolbar: { autoSelected: "pan" },
    events: {
      zoomed: function (chartContext, { xaxis, yaxis }) {
        currentXMin = xaxis.min;
        currentXMax = xaxis.max;
        currentYMin = yaxis.min;
        currentYMax = yaxis.max;
      },
      click: function (event, chartContext, config) {
        if (newsMode) {
          try {
            const candleIndex = config.dataPointIndex;
            if (candleIndex >= 0) {
              const candleTime = new Date(chartContext.w.globals.seriesX[0][candleIndex]);
              let timeRange = 3600000;
              if (chartContext.w.globals.seriesX[0].length >= 2 && candleIndex > 0) {
                const prevTime = new Date(chartContext.w.globals.seriesX[0][candleIndex - 1]).getTime();
                const currTime = candleTime.getTime();
                timeRange = currTime - prevTime;
              }
              const relatedNews = fetchedNews
                ? fetchedNews.filter((news) => {
                  const newsTime = news.pubDate * 1000;
                  return (
                    newsTime >= candleTime.getTime() &&
                    newsTime < candleTime.getTime() + timeRange
                  );
                })
                : [];
              showNewsModal(relatedNews);
            }
          } catch (err) {
            console.error("Error in news mode chart click event:", err);
          }
          return;
        }
        if (drawingMode || alertDrawingMode) {
          try {
            const globals = chartContext.w.globals;
            const offsetY = event.offsetY;
            const gridHeight = globals.gridHeight;
            if (!gridHeight) return;
            const gridSpacing = 5;
            const extraPoints = gridSpacing + 2;
            const price =
              Math.round((globals.maxY - (offsetY / gridHeight) * (globals.maxY - globals.minY)) * 100) / 100 +
              extraPoints;
            drawnLines.push({ price, alertOn: alertDrawingMode, alertTriggered: false });
            updateAnnotationsWrapper([]);
          } catch (err) {
            console.error("Error in chart click event:", err);
          }
        }
      },
    },
  },
  series: [],
  xaxis: { type: "datetime" },
  yaxis: { tooltip: { enabled: true }, opposite: true },
  plotOptions: {
    candlestick: {
      colors: { upward: "#008000", downward: "#ff0000" },
    },
  },
  annotations: { yaxis: [] },
  tooltip: newsMode
    ? {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        let candleTime = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
        let timeRange = 3600000;
        if (w.globals.seriesX[seriesIndex].length >= 2 && dataPointIndex > 0) {
          let prevTime = new Date(w.globals.seriesX[seriesIndex][dataPointIndex - 1]).getTime();
          let currTime = candleTime.getTime();
          timeRange = currTime - prevTime;
        }
        const relatedNews = fetchedNews
          ? fetchedNews.filter((news) => {
            let newsTime = news.pubDate * 1000;
            return (
              newsTime >= candleTime.getTime() &&
              newsTime < candleTime.getTime() + timeRange
            );
          })
          : [];
        return relatedNews.length > 0
          ? `<div class="p-2"><strong>${relatedNews[0].title}</strong></div>`
          : `<div class="p-2">No news available</div>`;
      },
    }
    : {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        if (!currentChartData || !currentChartData[dataPointIndex]) {
          return `<div class="apexcharts-tooltip">Loading...</div>`;
        }
        const item = currentChartData[dataPointIndex];
        const dateStr = new Date(item.datetime).toLocaleString();
        return `<div class="apexcharts-tooltip" style="padding:10px;">
                    <div><strong>${dateStr}</strong></div>
                    <div>Open: ${item.open}</div>
                    <div>High: ${item.high}</div>
                    <div>Low: ${item.low}</div>
                    <div>Close: ${item.close}</div>
                    <div>Volume: ${item.volume}</div>
                  </div>`;
      },
      shared: true,
      intersect: false,
    },
};

// ----------------------------------------------------------------------------------------
// Volume Chart Initial Options
// ----------------------------------------------------------------------------------------
const volumeOptions = {
  chart: {
    noData: { text: "Loading..." },
    group: "news_charts",
    type: "bar",
    selection: {
      enabled: true,
      xaxis: {
        min: new Date("20 Jan 2017").getTime(),
        max: new Date("10 Dec 2017").getTime(),
      },
    },
    height: 150,
    animations: { enabled: true },
    toolbar: { show: false },
    brush: {
      enabled: true,
      target: "candlestick-chart",
    },
  },
  series: [],
  xaxis: { type: "datetime" },
  plotOptions: {
    bar: { columnWidth: "60%" },
  },
  tooltip: { shared: true, intersect: false },
  yaxis: { labels: { show: false }, opposite: true },
};

// ----------------------------------------------------------------------------------------
// DOM Ready: Initialize Charts & UI Controls
// ----------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  try {
    const chartContainer = document.querySelector("#chart");
    const volumeContainer = document.querySelector("#volume-chart");
    if (!chartContainer) throw new Error("Element with id 'chart' not found.");
    if (!volumeContainer) throw new Error("Element with id 'volume-chart' not found.");

    chart = new ApexCharts(chartContainer, chartOptions);
    chart.render().catch((e) =>
      console.error("Error rendering candlestick chart:", e)
    );
    volumeChart = new ApexCharts(volumeContainer, volumeOptions);
    volumeChart.render().catch((e) =>
      console.error("Error rendering volume chart:", e)
    );

    // Set up Draw Line button
    const drawLineBtn = document.getElementById("draw-line-button");
    if (drawLineBtn) {
      drawLineBtn.addEventListener("click", function () {
        drawingMode = !drawingMode;
        this.classList.toggle("bg-blue-600", drawingMode);
        this.classList.toggle("bg-gray-400", !drawingMode);
      });
    } else {
      console.warn("draw-line-button not found.");
    }

    // Toggle Alert button
    const toggleAlertBtn = document.getElementById("toggle-alert-button");
    if (toggleAlertBtn) {
      toggleAlertBtn.addEventListener("click", function () {
        alertDrawingMode = !alertDrawingMode;
        this.classList.toggle("bg-blue-600", alertDrawingMode);
        this.classList.toggle("bg-gray-400", !alertDrawingMode);
      });
    } else {
      console.warn("toggle-alert-button not found.");
    }

    // Remove Drawn Lines
    const removeLineBtn = document.getElementById("remove-line-button");
    if (removeLineBtn) {
      removeLineBtn.addEventListener("click", function () {
        if (drawnLines.length === 0) {
          alert("No drawn lines to remove.");
          return;
        }
        const listStr = drawnLines
          .map((line, index) => `${index + 1}: Price = ${line.price.toFixed(2)}`)
          .join("<br>");
        document.getElementById("modal-lines").innerHTML = listStr;
        document.getElementById("removal-modal").classList.remove("hidden");
      });
    } else {
      console.warn("remove-line-button not found.");
    }

    // Cancel removal modal
    const cancelRemoveBtn = document.getElementById("cancel-remove");
    if (cancelRemoveBtn) {
      cancelRemoveBtn.addEventListener("click", function () {
        document.getElementById("removal-modal").classList.add("hidden");
      });
    }
    // Confirm removal modal
    const confirmRemoveBtn = document.getElementById("confirm-remove");
    if (confirmRemoveBtn) {
      confirmRemoveBtn.addEventListener("click", function () {
        try {
          const input = document.getElementById("remove-input").value;
          if (input) {
            const numbers = input
              .split(",")
              .map((s) => parseInt(s.trim()))
              .filter((n) => !isNaN(n));
            numbers.sort((a, b) => b - a);
            numbers.forEach((n) => {
              if (n > 0 && n <= drawnLines.length) {
                drawnLines.splice(n - 1, 1);
              }
            });
            updateAnnotationsWrapper([]);
          }
          document.getElementById("removal-modal").classList.add("hidden");
        } catch (err) {
          console.error("Error in confirm-remove click handler:", err);
        }
      });
    }

    // Update Button
    const updateBtn = document.getElementById("updateBtn");
    if (updateBtn) {
      updateBtn.addEventListener("click", function () {
        currentXMin = currentXMax = currentYMin = currentYMax = null;
        updateChart();
      });
    }

    // Market Select Dropdown
    const marketSelect = document.getElementById("marketSelect");
    if (marketSelect) {
      marketSelect.addEventListener("change", function (e) {
        const selectedId = parseInt(e.target.value);
        currentMarketId = selectedId;
        const market = activeMarkets.find((m) => m.id === selectedId);
        updateMarketInfo(market);
        updateChart();
      });
    }

    // News Mode Toggle Button
    const newsModeBtn = document.getElementById("news-mode-button");
    if (newsModeBtn) {
      newsModeBtn.addEventListener("click", function () {
        newsMode = !newsMode;
        this.classList.toggle("bg-blue-600", newsMode);
        this.classList.toggle("bg-gray-400", !newsMode);

        if (newsMode) {
          chart.updateOptions({
            tooltip: {
              custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                let candleTime = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
                let timeRange = 3600000;
                if (w.globals.seriesX[seriesIndex].length >= 2 && dataPointIndex > 0) {
                  let prevTime = new Date(w.globals.seriesX[seriesIndex][dataPointIndex - 1]).getTime();
                  let currTime = candleTime.getTime();
                  timeRange = currTime - prevTime;
                }
                const relatedNews = fetchedNews
                  ? fetchedNews.filter((news) => {
                    let newsTime = news.pubDate * 1000;
                    return (
                      newsTime >= candleTime.getTime() &&
                      newsTime < candleTime.getTime() + timeRange
                    );
                  })
                  : [];
                return relatedNews.length > 0
                  ? `<div class="p-2"><strong>${relatedNews[0].title}</strong></div>`
                  : `<div class="p-2">No news available</div>`;
              },
            },
            toolbar: { autoSelected: "pan" },
          });
        } else {
          chart.updateOptions({
            tooltip: {
              custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                if (!currentChartData || !currentChartData[dataPointIndex]) {
                  return `<div class="apexcharts-tooltip">Loading...</div>`;
                }
                const item = currentChartData[dataPointIndex];
                const dateStr = new Date(item.datetime).toLocaleString();
                return `<div class="apexcharts-tooltip" style="padding:10px;">
                          <div><strong>${dateStr}</strong></div>
                          <div>Open: ${item.open}</div>
                          <div>High: ${item.high}</div>
                          <div>Low: ${item.low}</div>
                          <div>Close: ${item.close}</div>
                          <div>Volume: ${item.volume}</div>
                        </div>`;
              },
              shared: true,
              intersect: false,
            },
            toolbar: { autoSelected: "pan" },
          });
        }
      });
    }

    if (typeof fetchActiveMarkets === "function") {
      fetchActiveMarkets();
    }
    setInterval(updateChart, 10000);
  } catch (err) {
    console.error("Error during DOMContentLoaded initialization:", err);
  }
});

// ----------------------------------------------------------------------------------------
// Utility: Generate Date String Based on Limit & Timeframe
// ----------------------------------------------------------------------------------------
function getDate(limit, timeframe) {
  const now = new Date();
  const value = parseInt(timeframe.slice(0, -1), 10);
  if (isNaN(value)) {
    throw new Error("Invalid timeframe: missing numeric part.");
  }
  const unit = timeframe.slice(-1).toLowerCase();
  let multiplier;
  switch (unit) {
    case "m":
      multiplier = 60 * 1000;
      break;
    case "h":
      multiplier = 60 * 60 * 1000;
      break;
    case "d":
      multiplier = 24 * 60 * 60 * 1000;
      break;
    default:
      throw new Error("Unsupported timeframe unit. Use 'm' for minutes, 'h' for hours, or 'd' for days.");
  }
  const totalMilliseconds = limit * value * multiplier;
  const targetTime = new Date(now.getTime() - totalMilliseconds);
  const year = targetTime.getFullYear();
  const month = String(targetTime.getMonth() + 1).padStart(2, "0");
  const day = String(targetTime.getDate()).padStart(2, "0");
  const hours = String(targetTime.getHours()).padStart(2, "0");
  const minutes = String(targetTime.getMinutes()).padStart(2, "0");
  const seconds = String(targetTime.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
console.log(getDate(60, "1m"));

// ----------------------------------------------------------------------------------------
// News Modal and Description Toggle Helpers
// ----------------------------------------------------------------------------------------
function getSentimentIndicator(news) {
  const pos = news.Positive != null ? news.Positive : 0;
  const neu = news.Neutral != null ? news.Neutral : 0;
  const neg = news.Negative != null ? news.Negative : 0;
  const maxVal = Math.max(pos, neu, neg);
  if (maxVal === 0) return "-";
  if (maxVal === pos) {
    return `<span class="text-green-500 font-bold">▲ ${pos}</span>`;
  } else if (maxVal === neg) {
    return `<span class="text-red-500 font-bold">▼ ${neg}</span>`;
  } else {
    return `<span class="text-gray-500 font-bold">→ ${neu}</span>`;
  }
}

function showNewsModal(relatedNews) {
  console.log(relatedNews);

  const newsContent = document.getElementById("news-content");
  if (!newsContent) return;
  const initialItems = relatedNews.slice(0, 5);
  const extraItems = relatedNews.slice(5);
  let html = "";

  initialItems.forEach((news, index) => {
    html += `
      <div class="flex items-center p-2 border rounded-md bg-gray-50 text-xs mb-2">
        <div class="w-16 h-16 flex-shrink-0 mr-2">
          <img src="${news.thImage}" alt="news image" class="w-full h-full object-cover rounded-md">
        </div>
        <div class="flex-1">
          <h4 class="font-bold">${index + 1}. ${news.title}</h4>
          <p class="news-description" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${news.articleBody}
          </p>
          ${news.articleBody && news.articleBody.length > 100
        ? `<button class="show-more text-blue-500 underline" onclick="toggleDescription(this)">Show More</button>`
        : ""
      }
          <a href="${news.link}" target="_blank" class="text-blue-500 underline">Read more</a>
        </div>
        <div class="w-24 text-center ml-2">
          ${getSentimentIndicator(news)}
        </div>
      </div>
    `;
  });
  if (extraItems.length > 0) {
    html += `<div id="extra-news" class="hidden">`;
    extraItems.forEach((news, index) => {
      html += `
        <div class="flex items-center p-2 border rounded-md bg-gray-50 text-xs mb-2">
          <div class="w-16 h-16 flex-shrink-0 mr-2">
            <img src="${news.thImage}" alt="news image" class="w-full h-full object-cover rounded-md">
          </div>
          <div class="flex-1">
            <h4 class="font-bold">${index + 6}. ${news.title}</h4>
            <p class="news-description" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${news.articleBody}
            </p>
            ${news.articleBody && news.articleBody.length > 100
          ? `<button class="show-more text-blue-500 underline" onclick="toggleDescription(this)">Show More</button>`
          : ""
        }
            <a href="${news.link}" target="_blank" class="text-blue-500 underline">Read more</a>
          </div>
          <div class="w-24 text-center ml-2">
            ${getSentimentIndicator(news)}
          </div>
        </div>
      `;
    });
    html += `</div>`;
    html += `<button id="show-more-btn" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none text-xs">Show More</button>`;
  }
  newsContent.innerHTML = html;
  document.getElementById("news-modal").classList.remove("hidden");
  const showMoreBtn = document.getElementById("show-more-btn");
  if (showMoreBtn) {
    showMoreBtn.addEventListener("click", function () {
      const extraNewsDiv = document.getElementById("extra-news");
      if (extraNewsDiv.classList.contains("hidden")) {
        extraNewsDiv.classList.remove("hidden");
        this.innerText = "Show Less";
      } else {
        extraNewsDiv.classList.add("hidden");
        this.innerText = "Show More";
      }
    });
  }
}

function toggleDescription(btn) {
  const p = btn.previousElementSibling;
  if (!p) return;
  if (p.style.display === "-webkit-box" || p.style.display === "") {
    p.style.display = "block";
    btn.innerText = "Show Less";
  } else {
    p.style.display = "-webkit-box";
    btn.innerText = "Show More";
  }
}

// ----------------------------------------------------------------------------------------
// Technical Analysis Component (Using Global token and id)
// ----------------------------------------------------------------------------------------
const TechnicalAnalysisComponent = (function () {
  const fetchBtn = document.getElementById("fetchBtn");
  const mainModal = document.getElementById("mainModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const analysisDateEl = document.getElementById("analysisDate");
  const signalDataContainer = document.getElementById("signalDataContainer");
  const supportLevelsContainer = document.getElementById("supportLevelsContainer");
  const recommendationActionContainer = document.getElementById("recommendationActionContainer");
  const resistanceLevelsContainer = document.getElementById("resistanceLevelsContainer");
  const tradingNotesContainer = document.getElementById("tradingNotesContainer");
  const infoIcon = document.getElementById("infoIcon");
  const componentsPopover = document.getElementById("componentsPopover");
  const componentsContent = document.getElementById("componentsContent");

  function getStatusBgColor(status) {
    const colors = {
      NEUTRAL: "bg-gray-200 text-gray-800",
      BULLISH: "bg-green-200 text-green-800",
      BEARISH: "bg-red-200 text-red-800",
      STRONG_TREND: "bg-purple-200 text-purple-800",
      OVERBOUGHT: "bg-orange-200 text-orange-800",
    };
    return colors[status] || "bg-gray-200 text-gray-800";
  }
  function getStatusTextColor(status) {
    const colors = {
      NEUTRAL: "text-gray-600",
      BULLISH: "text-green-600",
      BEARISH: "text-red-600",
      STRONG_TREND: "text-purple-600",
      OVERBOUGHT: "text-orange-600",
    };
    return colors[status] || "text-gray-600";
  }
  function getScoreColor(score) {
    if (score >= 20) return "text-green-600";
    if (score >= 10) return "text-blue-600";
    if (score >= 0) return "text-gray-600";
    return "text-red-600";
  }
  function getTrendIcon(status) {
    status = status.toUpperCase();
    if (status === "BULLISH") {
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline animate-bounce text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>`;
    } else if (status === "BEARISH") {
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline animate-bounce text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>`;
    } else {
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline animate-bounce text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16" />
              </svg>`;
    }
  }
  function getComponentsHTML(components) {
    let html = "";
    for (const [category, compData] of Object.entries(components)) {
      html += `<div class="space-y-1 border-b pb-2 mb-2">
                <h5 class="font-semibold capitalize">${category}</h5>
                <p><span class="font-semibold">Overall Score:</span> ${compData.score}</p>
                <ul class="ml-4 list-disc">`;
      for (const [indicator, indicatorData] of Object.entries(compData.analysis)) {
        const indicatorName = indicator.replace(/_/g, " ");
        html += `<li>
                  <span class="font-semibold capitalize">${indicatorName}:</span>
                  <span class="${getStatusTextColor(indicatorData.status)}">${indicatorData.status.replace(/_/g, " ")}</span>
                  ${getTrendIcon(indicatorData.status)}
                  (Score: ${indicatorData.score})
                 </li>`;
      }
      html += `</ul></div>`;
    }
    return html;
  }

  async function fetchTechnicalData() {
    const url = "http://188.34.202.221:8000/Market/exGetMultipleTechnicalIndicatorSignal/";
    const payload = {
      marketpair_id: id,
      timeframe: document.getElementById("timeframe").value,
      since: getDate(
        parseInt(document.getElementById("limit").value),
        document.getElementById("timeframe").value
      ),
      limit: parseInt(document.getElementById("limit").value),
    };
    try {
      const response = await axios.post(url, payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          Authorization: token,
        },
      });
      console.log("Technical data response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching technical data:", error);
      return null;
    }
  }

  function updateUI(fetchedData) {
    const analysisDate = new Date(fetchedData.signal.signal.timestamp).toLocaleDateString();
    analysisDateEl.textContent = `(${analysisDate})`;
    const signal = fetchedData.signal.signal;
    const signalHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="text-2xl font-bold">$${signal.price.toFixed(1)}</p>
          <p class="text-gray-500 text-sm">Current Price</p>
        </div>
        <div class="text-right">
          <span class="${getStatusBgColor(signal.value)} px-3 py-1 rounded-full text-sm inline-flex items-center">
            ${signal.value}
            <span id="signalArrow" class="ml-1"></span>
          </span>
          <p class="mt-1 text-sm ${getScoreColor(signal.score)}">Score: ${signal.score}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white p-3 rounded-lg border">
          <p class="text-gray-500 text-sm">Timestamp</p>
          <p class="font-medium">${new Date(signal.timestamp).toLocaleString()}</p>
        </div>
        <div class="bg-white p-3 rounded-lg border">
          <p class="text-gray-500 text-sm">Analysis Time</p>
          <p class="font-medium">${signal.datetime.split(" ")[1]}</p>
        </div>
      </div>
    `;
    signalDataContainer.innerHTML = signalHTML;
    document.getElementById("signalArrow").innerHTML = getTrendIcon(signal.value);
    const supportHTML = `
      <h4 class="text-lg font-semibold mb-4 text-green-600">Support Levels</h4>
      <div class="space-y-3">
        ${fetchedData.signal.recommendation.support_levels
        .map(
          (level) => `
          <div class="flex justify-between items-center bg-green-50 p-3 rounded-lg">
            <div>
              <span class="font-medium">$${level.price.toFixed(1)}</span>
              <span class="text-sm text-green-500 ml-2">
                ${level.distance.toFixed(1)} ${getTrendIcon("BULLISH")}
              </span>
            </div>
            <div class="text-sm text-green-700">Strength: ${level.strength}</div>
          </div>
        `
        )
        .join("")}
      </div>
    `;
    supportLevelsContainer.innerHTML = supportHTML;
    const rec = fetchedData.signal.recommendation;
    const actionHTML = `
      <h4 class="text-lg font-semibold mb-4 text-blue-600">Recommendation Action</h4>
      <div class="bg-blue-50 p-3 rounded-lg border">
        <p class="font-medium">Action: <span class="ml-2">${rec.action}</span></p>
      </div>
    `;
    recommendationActionContainer.innerHTML = actionHTML;
    const resistanceHTML = `
      <h4 class="text-lg font-semibold mb-4 text-red-600">Resistance Levels</h4>
      <div class="space-y-3">
        ${rec.resistance_levels
        .map(
          (level) => `
          <div class="flex justify-between items-center bg-red-50 p-3 rounded-lg">
            <div>
              <span class="font-medium">$${level.price.toFixed(1)}</span>
              <span class="text-sm text-red-500 ml-2">
                ${Math.abs(level.distance).toFixed(1)}%  ${getTrendIcon("BEARISH")}
              </span>
            </div>
            <div class="text-sm text-red-700">Strength: ${level.strength}</div>
          </div>
        `
        )
        .join("")}
      </div>
    `;
    resistanceLevelsContainer.innerHTML = resistanceHTML;
    const notesHTML = `
      <h4 class="text-lg font-semibold text-yellow-800 mb-2">Trading Notes</h4>
      <p class="text-yellow-800">${rec.notes}</p>
    `;
    tradingNotesContainer.innerHTML = notesHTML;
    const componentsHTML = getComponentsHTML(fetchedData.signal.components);
    componentsContent.innerHTML = componentsHTML;
  }

  function init() {
    fetchBtn.addEventListener("click", async function () {
      fetchBtn.textContent = "Loading...";
      fetchBtn.classList.add("bg-gray-400", "cursor-not-allowed");
      fetchBtn.disabled = true;
      const fetchedData = await fetchTechnicalData();
      if (fetchedData) {
        updateUI(fetchedData);
        openModal();
      }
      fetchBtn.textContent = "Show Analysis";
      fetchBtn.classList.remove("bg-gray-400", "cursor-not-allowed");
      fetchBtn.disabled = false;
    });
    closeModalBtn.addEventListener("click", closeModal);
    infoIcon.addEventListener("click", function (event) {
      event.stopPropagation();
      componentsPopover.classList.toggle("hidden");
    });
    window.addEventListener("click", function (event) {
      if (!componentsPopover.contains(event.target) && event.target.id !== "infoIcon") {
        componentsPopover.classList.add("hidden");
      }
    });
  }
  function openModal() {
    mainModal.classList.remove("hidden");
  }
  function closeModal() {
    mainModal.classList.add("hidden");
  }
  return { init };
})();

document.addEventListener("DOMContentLoaded", function () {
  TechnicalAnalysisComponent.init();
});
