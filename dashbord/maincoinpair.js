import ApexCharts from "apexcharts";
import {GetNewsbyDateCategory,GetMarketPair,ListPairs,exGetTrendWithOHLCV,exGetOHLCV,exGetIntelligentSupportResistanceLevels,exGetMultipleTechnicalIndicatorSignal,ex_getSymbolInfo} from './endpoints'
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


// ----------------------------------------------------------------------------------------

let srMode = false;
let srModeInterval = null;


let cryptoComponent = null;
let first_time = true;
let pair_name = null
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



  // console.log(pair_name);


  try {
    let params = {
      symbols: pair_name,
      startDate: firstCandleTime,
      category: "cryptocurrencies"
    };
    let newsResponse = await axios.post(
      GetNewsbyDateCategory,
      
      params,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          Authorization: 'd4735e3a265e16ee2393953',
        },
      }
    );
    console.log('newsResponse',newsResponse);
    if (newsResponse.data && newsResponse.data.return) {
      // console.log('fetchedNews',fetchedNews);

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
  const url = GetMarketPair ;
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


          pair_name = data.pair.name




          if (first_time) {

            

            cryptoComponent = new CryptoDataComponent(
              'e19ad04e557b1cc1fee6b60b4d421fef',
              pair_name,
              document.getElementById('news_statistics')
            );




          }

          first_time = false;

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
    const response = await axios.get(ListPairs, {
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
// Fetch OHLCV Data and Process for Candlestick & Volume Charts
// ----------------------------------------------------------------------------------------
async function fetchOHLCVData() {
  const marketpair_id = currentMarketId;
  console.log("Market ID:", marketpair_id);
  const timeframe = document.getElementById("timeframe").value;
  const limit = parseInt(document.getElementById("limit").value);
  const since = getDate(limit, timeframe);
  let chart_type = document.getElementById("chart_type").checked;
  let url = chart_type
    ? exGetTrendWithOHLCV
    : exGetOHLCV;
  if (chart_type) {
    // document.getElementById("advanced_chart_tools").classList.remove("hidden");
    document.getElementById("modal-wrapper").classList.remove("hidden");

  } else {
    // document.getElementById("advanced_chart_tools").classList.add("hidden");
    document.getElementById("modal-wrapper").classList.add("hidden");

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
      const firstCandleTime = Math.floor(
        new Date(ohlcv[0].datetime).getTime() / 1000
      );
      if (newsMode) {
        console.log("News mode is active");
        // showLoading();
        await fetchNewsall(firstCandleTime);

        // hideLoading();
      }
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
// New Function: Fetch and Update Support/Resistance (SR) Levels for SR Mode
// ----------------------------------------------------------------------------------------
async function fetchAndUpdateSRLevels() {
  try {

    const marketpair_id = currentMarketId;
    console.log("Market ID:", marketpair_id);
    const timeframe = document.getElementById("timeframe").value;
    const limit = parseInt(document.getElementById("limit").value);
    const since = getDate(limit, timeframe);
    // Change the URL to your specific SR levels endpoint.
    const response = await axios.post(
      exGetIntelligentSupportResistanceLevels
      ,
      { marketpair_id, timeframe, since, limit },
      {
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      }
    );
    if (response.data.return) {
      const srData = response.data.sr_levels;

      let annotations = [];
      // Process resistance levels
      if (srData.resistance_levels) {
        srData.resistance_levels.forEach((level, index) => {
          annotations.push({
            y: level.price,
            borderColor: "red",
            label: {
              borderColor: "red",
              style: { color: "#fff", background: "red" },
              text: `R${index + 1}`,
              position: "left",
            },
          });
        });
      }
      // Process support levels
      if (srData.support_levels) {
        srData.support_levels.forEach((level, index) => {
          annotations.push({
            y: level.price,
            borderColor: "green",
            label: {
              borderColor: "green",
              style: { color: "#fff", background: "green" },
              text: `S${index + 1}`,
              position: "left",
            },
          });
        });
      }
      // Process pivot point if present
      if (srData.pivot_points) {
        annotations.push({
          y: srData.pivot_points.pivot,
          borderColor: "blue",
          label: {
            borderColor: "blue",
            style: { color: "#fff", background: "blue" },
            text: "Pivot",
            position: "left",
          },
        });
      }
      // Update chart annotations with the fetched SR levels.
      chart.updateOptions({ annotations: { yaxis: annotations } });
      // Force a chart resize/redraw to address any blank render issues.
      // window.dispatchEvent(new Event("resize"));
      ;
    }
  } catch (error) {
    console.error("Error fetching SR levels:", error);
  }
}

// ----------------------------------------------------------------------------------------
// Main Chart Update Function with Optimized Data Append & Resize
// ----------------------------------------------------------------------------------------
let first_time_candles = true ;
let bullishColor = document.getElementById("bullish-color")
  ? document.getElementById("bullish-color").value
  : "#008000";

let bearishColor = document.getElementById("bearish-color")
  ? document.getElementById("bearish-color").value
  : "#ff0000";
async function updateChart() {
  try {
    if (first_time_candles){
      showLoading()
    }
    const data = await fetchOHLCVData();
    hideLoading()
    first_time_candles =false ; 
    // console.log("OHLCV Data:", data);
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("No OHLCV data available.");
      return;
    }
    currentChartData = data; // Save data for tooltips

    if (data.length !== currentCandleCount) {
      currentXMin = currentXMax = currentYMin = currentYMax = null;
    }

    const candlestickData = data.map((d) => ({
      x: new Date(d.datetime),
      y: [parseFloat(d.open).toFixed(2), parseFloat(d.high).toFixed(2), parseFloat(d.low).toFixed(2), parseFloat(d.close).toFixed(2)],
    }));

    bullishColor = document.getElementById("bullish-color")
      ? document.getElementById("bullish-color").value
      : "#008000";
    bearishColor = document.getElementById("bearish-color")
      ? document.getElementById("bearish-color").value
      : "#ff0000";
    const volumeData = data.map((d) => ({
      x: new Date(d.datetime),
      y: parseFloat(d.volume).toFixed(2),
      fillColor: d.close > d.open ? bullishColor : bearishColor,
    }));

    let newXMax = null;
    if (candlestickData.length >= 2) {
      const lastTime = candlestickData[candlestickData.length - 1].x.getTime();
      const secondLastTime = candlestickData[candlestickData.length - 2].x.getTime();
      const diff = lastTime - secondLastTime;
      newXMax = lastTime + diff * 5;
    }

    // Build series array
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

    // Append or update series based on candle count change.
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
      chart
        .updateSeries(series, true)
        .catch((err) => console.error("Error in full series update:", err));
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
        .catch((err) => console.error("Error updating volume chart:", err));
      currentVolumeCount = volumeData.length;
    }

    // If SR mode is not active, update using default annotations.
    if (!srMode) {
      chart.updateOptions({ annotations: { yaxis: getAnnotations(data) } });
    }

    // Force a chart update/resize to solve the blank display issue.
    // window.dispatchEvent(new Event("resize"));
    ;

    // Update other UI elements (MACD, Price, Trend indicators, etc.)
    const lastCandle = data[data.length - 1];
    const macdSignal = lastCandle.MACD_signal == lastCandle.MACD;
    // if (macdSignal) {
    //   macdlastsignal = lastCandle.MACD_signal;
    // } else if (macdlastsignal === 0) {
    //   document.getElementById("macd-recommendation").innerText = "Waiting ...";
    // } else if (macdlastsignal > lastCandle.MACD_signal) {
    //   document.getElementById("macd-recommendation").innerText = "BUY";
    // } else {
    //   document.getElementById("macd-recommendation").innerText = "SELL";
    // }
    const currentPrice = lastCandle.close;
    const currentPriceColor =
      lastCandle.close > lastCandle.open ? bullishColor : bearishColor;

    console.log('update trend', lastCandle.TREND_RECOMMENDATION);


    document.getElementById('advance_chart_pair_name').innerText = pair_name



    updateTrend(lastCandle.TREND_RECOMMENDATION, lastCandle.TREND_STRENGTH)
    if (document.getElementById("trend-recommendation")) {
      document.getElementById("trend-recommendation").innerText =
        lastCandle.TREND_RECOMMENDATION || "N/A";
    }
    if (document.getElementById("trend-strength")) {
      document.getElementById("trend-strength").innerText =
        lastCandle.TREND_STRENGTH !== undefined ? lastCandle.TREND_STRENGTH.toFixed(2) : "N/A";
    }
    if (document.getElementById("current-price")) {
      document.getElementById("current-price").innerHTML =
        `<span style="color:${currentPriceColor}; font-weight:bold;">${currentPrice.toFixed(2)}</span>`;
    }
  } catch (err) {
    console.error("Error in updateChart function:", err);
  }
}


function updateTrend(recommendation, strength) {
  const icons = {
    'STRONG_UPTREND': '#strong-uptrend',
    'UPTREND': '#uptrend',
    'STRONG_DOWNTREND': '#strong-downtrend',
    'DOWNTREND': '#downtrend',
    'NEUTRAL': '#neutral'
  };

  // console.log('icon things : ', recommendation ,icons[recommendation]);
  
  const icon = document.querySelector(icons[recommendation]).cloneNode(true);
  icon.classList.remove('hidden');
  document.getElementById('trend-icon').innerHTML = '';
  document.getElementById('trend-icon').appendChild(icon);

  // Update strength meter
  const strengthBar = document.getElementById('strength-bar');
  strengthBar.style.width = `${Math.abs(strength)}%`;
  strengthBar.style.background = strength >= 0
    ? `linear-gradient(90deg, ${bullishColor} 0%, #fff 100%)`
    : `linear-gradient(90deg, #fff 0%, ${bearishColor} 100%)`;
}

// ----------------------------------------------------------------------------------------
// Initial Chart Options & Volume Chart Options
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
            if (candleIndex >= 0 && currentChartData && currentChartData[candleIndex]) {
              const candleTime = new Date(currentChartData[candleIndex].datetime);
              let timeRange = 3600000;
              if (currentChartData.length >= 2 && candleIndex > 0) {
                const prevTime = new Date(currentChartData[candleIndex - 1].datetime).getTime();
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
              Math.round((maxY - (offsetY / gridHeight) * (maxY - minY)) * 100) / 100 +
              extraPoints;
            drawnLines.push({ price, alertOn: alertDrawingMode, alertTriggered: false });
            updateAnnotationsWrapper(currentChartData);
          } catch (err) {
            console.error("Error during drawing click event:", err);
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
                    <div>Open: ${parseFloat(item.open).toFixed(2)}</div>
                    <div>High: ${parseFloat(item.high).toFixed(2)}</div>
                    <div>Low: ${parseFloat(item.low).toFixed(2)}</div>
                    <div>Close: ${parseFloat(item.close).toFixed(2)}</div>
                    <div>Volume: ${parseFloat(item.volume).toFixed(2)}</div>
                  </div>`;
      },
      shared: true,
      intersect: false,
    },
};

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
      enabled: false,
      target: "candlestick-chart",
    },
  },
  series: [],
  xaxis: { type: "datetime" },
  plotOptions: {
    bar: { columnWidth: "60%" },
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: { shared: true, intersect: false },
  yaxis: { labels: { show: false }, opposite: false },
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

    // Initialize charts
    chart = new ApexCharts(chartContainer, chartOptions);
    chart
      .render()
      .catch((e) => console.error("Error rendering candlestick chart:", e));
    volumeChart = new ApexCharts(volumeContainer, volumeOptions);
    volumeChart
      .render()
      .catch((e) => console.error("Error rendering volume chart:", e));

    // Toggle Draw Line Mode
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

    // Toggle Alert Drawing Mode
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

    // Remove Drawn Lines Button
    const removeLineBtn = document.getElementById("remove-line-button");
    if (removeLineBtn) {
      removeLineBtn.addEventListener("click", function () {
        if (drawnLines.length === 0) {
          alert("No drawn lines to remove.");
          return;
        }
        const listStr = drawnLines
          .map((line, index) => `${index + 1}: Price = ${parseFloat(line.price).toFixed(2)}`)
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
            updateAnnotationsWrapper(currentChartData);
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
        // updateMarketInfo() could be defined elsewhere as needed.
        updateChart();
      });
    }

    // News Mode Toggle Button
    const newsModeBtn = document.getElementById("news-mode-button");
    if (newsModeBtn) {
      newsModeBtn.addEventListener("click", function () {

        cryptoComponent.fetchData();
        document.getElementById('news_statistics').classList.toggle('hidden')
        newsMode = !newsMode;
        this.classList.toggle("bg-blue-600", newsMode);
        this.classList.toggle("bg-gray-100", !newsMode);

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
                          <div>Open: ${parseFloat(item.open).toFixed(2)}</div>
                          <div>High: ${parseFloat(item.high).toFixed(2)}</div>
                          <div>Low: ${parseFloat(item.low).toFixed(2)}</div>
                          <div>Close: ${parseFloat(item.close).toFixed(2)}</div>
                          <div>Volume: ${parseFloat(item.volume).toFixed(2)}</div>
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

    // SR Mode Toggle Button
    const srModeBtn = document.getElementById("sr-mode-button");
    if (srModeBtn) {
      srModeBtn.addEventListener("click", function () {
        srMode = !srMode;
        this.classList.toggle("bg-blue-600", srMode);
        this.classList.toggle("bg-gray-100", !srMode);

        if (srMode) {
          // Immediately fetch SR data and set interval to update every 5 minutes.
          fetchAndUpdateSRLevels();
          srModeInterval = setInterval(fetchAndUpdateSRLevels, 300000);
        } else {
          // If deactivated, clear the interval and restore default annotations.
          if (srModeInterval) {
            clearInterval(srModeInterval);
            srModeInterval = null;
          }
          chart.updateOptions({ annotations: { yaxis: getAnnotations(currentChartData) } });
        }
      });
    } else {
      console.warn("Element with id 'sr-mode-button' not found.");
    }

    // Start regular chart updates every 10 seconds.
    updateChart()
    setInterval(updateChart, 5000);
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
// console.log(getDate(60, "1m"));

// ----------------------------------------------------------------------------------------
// News Modal and Description Toggle Helpers
// ----------------------------------------------------------------------------------------
function getSentimentIndicator(news) {
  const pos = news.Positive != null ? news.Positive.toFixed(2) : 0;
  const neu = news.Neutral != null ? news.Neutral.toFixed(2) : 0;
  const neg = news.Negative != null ? news.Negative.toFixed(2) : 0;
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


// show more 
//<button class="show-more text-blue-500 underline" onclick="toggleDescription(this)">Show More</button>

function showNewsModal(relatedNews) {
  // console.log(relatedNews);

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
        ? ``
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
          ? ``
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
    if (score > 20) {
      // console.log('green');

      document.getElementById('seperator_line').classList = 'absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r  to-gray-50 from-green-500'
    } else if (score < 20) {

      // console.log('red');

      document.getElementById('seperator_line').classList = 'absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r  to-gray-50 from-red-500'

    } else {
      // console.log('blue');

      document.getElementById('seperator_line').classList = 'absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r  to-gray-50 from-blue-500'

    }
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
    const url = exGetMultipleTechnicalIndicatorSignal;
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
      // console.log("Technical data response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching technical data:", error);
      return null;
    }
  }


  // Preserve these globals
  let selectedSupport = null;
  let selectedResistance = null;

  // Toggle the title popup
  document.getElementById('modalInfoBtn').addEventListener('click', () => {
    document.getElementById('modalInfoPopover').classList.toggle('hidden');
  });

  // Close modal
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('mainModal').classList.add('hidden');
  });

  function updateUI(fetchedData) {
    // ── 1) Header & components ──
    const analysisDate = new Date(fetchedData.signal.signal.timestamp).toLocaleDateString();
    analysisDateEl.textContent = analysisDate;
    // Populate components popup
    const compHtml = fetchedData.signal.components
      .map(c => `<div>• ${c.name}: ${c.value}</div>`).join('');
    document.getElementById('componentsContent').innerHTML = compHtml;

    const signal = fetchedData.signal.signal;
    const rec = fetchedData.signal.recommendation;
    const price = parseFloat(signal.price);

    // ── 2) Support / Resistance / Price ──
    document.getElementById('srPriceContainer').textContent = `$${price.toFixed(2)}`;

    // Supports
    const supEl = document.getElementById('supportLevelsContainer');
    supEl.innerHTML = '';
    rec.support_levels.forEach(l => {
      const btn = document.createElement('button');
      btn.textContent = `🟢 $${parseFloat(l.price).toFixed(2)}`;
      btn.className = `w-full text-left p-2 mb-1 rounded ${
        selectedSupport===l.price ? 'bg-green-300' : 'bg-green-100 hover:bg-green-200'
      }`;
      btn.onclick = () => {
        selectedSupport = l.price;
        renderSelections();
        tryBuildCustomTrade(price);
      };
      supEl.appendChild(btn);
    });

    // Resistances
    const resEl = document.getElementById('resistanceLevelsContainer');
    resEl.innerHTML = '';
    rec.resistance_levels.forEach(l => {
      const btn = document.createElement('button');
      btn.textContent = `🔴 $${parseFloat(l.price).toFixed(2)}`;
      btn.className = `w-full text-left p-2 mb-1 rounded ${
        selectedResistance===l.price ? 'bg-red-300' : 'bg-red-100 hover:bg-red-200'
      }`;
      btn.onclick = () => {
        selectedResistance = l.price;
        renderSelections();
        tryBuildCustomTrade(price);
      };
      resEl.appendChild(btn);
    });

    function renderSelections() {
      // re-draw support/res lists to update highlight
      updateUI({ signal: { signal, recommendation: rec, components: fetchedData.signal.components }});
    }

    // ── 3) Wallet Overview ──
    const walletBalance = 1000;
    document.getElementById('wallet_overview').innerHTML = `
      <div class="flex gap-4 items-center">
        <div class="text-2xl">👛</div>
        <div>
          <p class="text-sm text-gray-600">Current Balance</p>
          <p class="text-lg font-semibold text-gray-800">${walletBalance} $</p>
        </div>
      </div>
      <div class="flex gap-4 items-center">
        <div class="text-2xl">💹</div>
        <div>
          <p class="text-sm text-gray-600">Current Price</p>
          <p class="text-lg font-semibold text-gray-800">$${price.toFixed(2)}</p>
        </div>
      </div>
    `;

    // ── 4) Trading Recommendation Cards ──
    // compute strongest/weakest once
    const strongestSupport = rec.support_levels.reduce((m,l)=>l.strength>m.strength?l:m, rec.support_levels[0]);
    const weakestSupport   = rec.support_levels.reduce((m,l)=>l.strength<m.strength?l:m, rec.support_levels[0]);
    const strongestRes     = rec.resistance_levels.reduce((m,l)=>l.strength>m.strength?l:m, rec.resistance_levels[0]);
    const weakestRes       = rec.resistance_levels.reduce((m,l)=>l.strength<m.strength?l:m, rec.resistance_levels[0]);

    const dynamicSize = (walletBalance / price) * 1; // assume 1× leverage for custom

    // build original grid + custom placeholder
    let cards = [];

    // Custom S/R Trade
    if (selectedSupport && selectedResistance) {
      const profit = (selectedResistance - selectedSupport) * dynamicSize;
      cards.push(`
        <div onclick="confirmAction('Custom S/R Trade', ${selectedSupport}, ${selectedResistance})"
             class="cursor-pointer bg-white p-4 rounded-lg border border-orange-200 hover:bg-orange-100">
          <div class="flex items-center gap-2 mb-1 text-orange-600">
            🔧 <span class="font-medium">Custom S/R Trade</span>
          </div>
          <p class="text-sm">S: $${selectedSupport.toFixed(2)} → R: $${selectedResistance.toFixed(2)}</p>
          <p class="text-lg font-semibold">Profit: $${profit.toFixed(2)}</p>
        </div>
      `);
    }

    // Optimal & High Risk and Mirror & AI (original style)
    // Optimal
    const optTP = rec.action.startsWith('BUY') ? strongestRes.price : strongestSupport.price;
    const optSL = rec.action.startsWith('BUY') ? strongestSupport.price : strongestRes.price;
    const optProfit = dynamicSize * Math.abs(optTP - price);
    cards.push(`
      <div onclick="confirmAction('Optimal Risk ${rec.action.startsWith('BUY')?'Buy':'Sell'}')"
           class="cursor-pointer bg-white p-4 rounded-lg border ${
             rec.action.startsWith('BUY')?'border-green-200 hover:bg-green-100':'border-red-200 hover:bg-red-100'
           }">
        <div class="flex items-center gap-2 mb-1 ${
          rec.action.startsWith('BUY')?'text-green-600':'text-red-600'
        }">
          ${rec.action.startsWith('BUY')?'🔼':'🔽'} <span class="font-medium">Optimal Risk ${rec.action.startsWith('BUY')?'Buy':'Sell'}</span>
        </div>
        <p class="text-sm">TP: $${optTP.toFixed(2)} | SL: $${optSL.toFixed(2)}</p>
        <p class="text-lg font-semibold">Profit: $${optProfit.toFixed(2)}</p>
      </div>
    `);

    // High Risk
    const highTP = rec.action.startsWith('BUY') ? weakestRes.price : weakestSupport.price;
    const highSL = rec.action.startsWith('BUY') ? weakestSupport.price : weakestRes.price;
    const highProfit = dynamicSize * Math.abs(highTP - price);
    cards.push(`
      <div onclick="confirmAction('High Risk ${rec.action.startsWith('BUY')?'Buy':'Sell'}')"
           class="cursor-pointer bg-white p-4 rounded-lg border border-orange-200 hover:bg-orange-100">
        <div class="flex items-center gap-2 mb-1 text-orange-600">
          ${rec.action.startsWith('BUY')?'🔼':'🔽'} <span class="font-medium">High Risk ${rec.action.startsWith('BUY')?'Buy':'Sell'}</span>
        </div>
        <p class="text-sm">TP: $${highTP.toFixed(2)} | SL: $${highSL.toFixed(2)}</p>
        <p class="text-lg font-semibold">Profit: $${highProfit.toFixed(2)}</p>
      </div>
    `);

    // Mirror Optimal
    const mirrorOptProfit = dynamicSize * Math.abs(price - optTP);
    cards.push(`
      <div onclick="confirmAction('Mirror Optimal ${rec.action.startsWith('BUY')?'Sell':'Buy'}')"
           class="cursor-pointer bg-white p-4 rounded-lg border ${
             rec.action.startsWith('BUY')?'border-red-200 hover:bg-red-100':'border-green-200 hover:bg-green-100'
           }">
        <div class="flex items-center gap-2 mb-1 ${
          rec.action.startsWith('BUY')?'text-red-600':'text-green-600'
        }">
          ${rec.action.startsWith('BUY')?'🔽':'🔼'} <span class="font-medium">Mirror Optimal ${rec.action.startsWith('BUY')?'Sell':'Buy'}</span>
        </div>
        <p class="text-sm">TP: $${optTP.toFixed(2)} | SL: $${optSL.toFixed(2)}</p>
        <p class="text-lg font-semibold">Profit: $${mirrorOptProfit.toFixed(2)}</p>
      </div>
    `);

    // Mirror High Risk
    const mirrorHighProfit = dynamicSize * Math.abs(price - highTP);
    cards.push(`
      <div onclick="confirmAction('Mirror High Risk ${rec.action.startsWith('BUY')?'Sell':'Buy'}')"
           class="cursor-pointer bg-white p-4 rounded-lg border border-orange-200 hover:bg-orange-100">
        <div class="flex items-center gap-2 mb-1 text-orange-600">
          ${rec.action.startsWith('BUY')?'🔽':'🔼'} <span class="font-medium">Mirror High Risk ${rec.action.startsWith('BUY')?'Sell':'Buy'}</span>
        </div>
        <p class="text-sm">TP: $${highTP.toFixed(2)} | SL: $${highSL.toFixed(2)}</p>
        <p class="text-lg font-semibold">Profit: $${mirrorHighProfit.toFixed(2)}</p>
      </div>
    `);

    // AI Recommends
    if (rec.risk_reward_ratio) {
      const secTP = rec.take_profit_1;
      const bestTP = rec.take_profit_2;
      const secureProfit = dynamicSize * Math.abs(secTP - price);
      const bestProfit   = dynamicSize * Math.abs(bestTP - price);
      cards.push(`
        <div onclick="confirmAction('Secure Trade')"
             class="cursor-pointer bg-white p-4 rounded-lg border border-teal-200 hover:bg-teal-100">
          <div class="flex items-center gap-2 mb-1 text-teal-600">🔒 <span class="font-medium">Secure Trade</span></div>
          <p class="text-sm">TP: $${secTP.toFixed(2)} | SL: $${rec.stop_loss.toFixed(2)}</p>
          <p class="text-lg font-semibold">Profit: $${secureProfit.toFixed(2)}</p>
        </div>
      `);
      cards.push(`
        <div onclick="confirmAction('Best Reward Trade')"
             class="cursor-pointer bg-white p-4 rounded-lg border border-purple-200 hover:bg-purple-100">
          <div class="flex items-center gap-2 mb-1 text-purple-600">🏆 <span class="font-medium">Best Reward</span></div>
          <p class="text-sm">TP: $${bestTP.toFixed(2)} | SL: $${rec.stop_loss.toFixed(2)}</p>
          <p class="text-lg font-semibold">Profit: $${bestProfit.toFixed(2)}</p>
        </div>
      `);
    }

    // Render them in a 2-col grid:
    document.getElementById('recomendations').innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        ${cards.join('')}
      </div>
    `;

    // ── 5) Trading Notes ──
    tradingNotesContainer.innerHTML = `
      <h4 class="text-lg font-semibold text-yellow-800 mb-2">Trading Notes</h4>
      <p class="text-yellow-800">${rec.notes}</p>
    `;
  }

  function tryBuildCustomTrade(price) {
    // Called when both selectedSupport & selectedResistance set
    if (selectedSupport && selectedResistance) {
      // trigger re-render of recs via updateUI
      // (price already passed in)
      updateUI({ signal: { signal: { ...fetchedData.signal.signal, price }, recommendation: fetchedData.signal.recommendation, components: fetchedData.signal.components }});
    }
  }
  
//   function updateUI(fetchedData) {
//     // Assume a fixed wallet balance (e.g. 1000 $) – or get it dynamically if available.
//     const walletBalance = 1000;
//     const analysisDate = new Date(fetchedData.signal.signal.timestamp).toLocaleDateString();
//     analysisDateEl.textContent = `${analysisDate}`;

//     const signal = fetchedData.signal.signal;
//     const rec = fetchedData.signal.recommendation;

//     const actionHTML = `
//   <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
//     <!-- Header -->
//     <div class="flex items-center gap-3 mb-6">
//       <div class="p-2 bg-blue-100 rounded-lg">
//         📈
//       </div>
//       <h4 class="text-xl font-bold text-gray-800  flex flex-col items-center">
//         Trading Recommendation
//         <span class="block text-sm font-normal text-gray-500">Based on technical analysis</span>
//       </h4>

//         <button id="trading_recom_info" class=" text-gray-400 hover:text-indigo-600 transition-colors">
//           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
//               d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>
//         </button>
//     </div>

//     <!-- Recommendation Grid -->
//     <div class="grid md:grid-cols-2 gap-4 mb-6">
//       <!-- Action Card -->
//       <div class="bg-white p-4 rounded-lg border ${rec.action === 'BUY' || rec.action === 'STRONG_BUY' ? 'border-green-200' : 'border-red-200'}">
//         <div class="flex items-center gap-3 mb-2">
//           <span class="p-2 rounded-lg ${rec.action === 'BUY' || rec.action === 'STRONG_BUY' ? 'bg-green-100' : 'bg-red-100'}">
//             ${rec.action === 'BUY' || rec.action === 'STRONG_BUY' ? '🔼' : '🔽'}
//           </span>
//           <div>
//             <p class="text-sm text-gray-600">Recommended Action</p>
//             <p class="text-lg font-bold ${rec.action === 'BUY' || rec.action === 'STRONG_BUY' ? 'text-green-600' : 'text-red-600'}">${rec.action}</p>
//           </div>
//         </div>
//       </div>

//       ${rec.risk_reward_ratio ? `<!-- Risk/Reward Card -->
//       <div class="bg-white p-4 rounded-lg border border-blue-200">
//         <div class="flex items-center gap-3">
//           <span class="p-2 rounded-lg bg-blue-100">⚖️</span>
//           <div>
//             <p class="text-sm text-gray-600">Risk/Reward Ratio</p>
//             <p class="text-lg font-bold text-blue-600">${rec.risk_reward_ratio.toFixed(2)}</p>
//           </div>
//         </div>
//       </div>
//     </div>

//     <!-- Targets Grid -->
//     <div class="grid md:grid-cols-3 gap-4 mb-6">
//       <div class="bg-white p-4 rounded-lg border border-red-200">
//         <p class="text-sm text-gray-600 mb-1">🛑 Stop Loss</p>
//         <p class="font-semibold text-red-600">${rec.stop_loss.toFixed(2)}</p>
//       </div>
//       <div class="bg-white p-4 rounded-lg border border-green-200">
//         <p class="text-sm text-gray-600 mb-1">🎯 Take Profit 1</p>
//         <p class="font-semibold text-green-600">${rec.take_profit_1.toFixed(2)}</p>
//       </div>
//       <div class="bg-white p-4 rounded-lg border border-green-200">
//         <p class="text-sm text-gray-600 mb-1">🎯 Take Profit 2</p>
//         <p class="font-semibold text-green-600">${rec.take_profit_2.toFixed(2)}</p>
//       </div>
//     </div>` : ''}
      

    
// `;

//     // document.getElementById('recommendationActionContainer').innerHTML = actionHTML;

//     // console.log(pair_name);


//     // Build the primary signal display
//     const signalHTML = `
//         <div class="flex items-center justify-between">
//           <div>
//             <p class="text-2xl font-bold">$${parseFloat(signal.price).toFixed(2)} (${pair_name})</p>
//             <p class="text-gray-500 text-sm">Current Price</p>
//           </div>
//           <div class="text-right">
//             <span class="${getStatusBgColor(signal.value)} px-3 py-1 rounded-full text-sm inline-flex items-center">
//               ${signal.value}
//               <span id="signalArrow" class="ml-1"></span>
//             </span>
//             <p class="mt-1 text-sm ${getScoreColor(signal.score)}">Score: ${parseFloat(signal.score).toFixed(2)}</p>
//           </div>
//         </div>
//         <div class="grid grid-cols-2 gap-4">
//           <div class="bg-white p-3 rounded-lg border">
//             <p class="text-gray-500 text-sm">Timestamp</p>
//             <p class="font-medium">${new Date(signal.timestamp).toLocaleString()}</p>
//           </div>
//           <div class="bg-white p-3 rounded-lg border">
//             <p class="text-gray-500 text-sm">Analysis Time</p>
//             <p class="font-medium">${signal.datetime.split(" ")[1]}</p>
//           </div>
//         </div>
//     `;
//     // signalDataContainer.innerHTML = signalHTML;
//     // document.getElementById("signalArrow").innerHTML = getTrendIcon(signal.value);

//     // Build Support Levels display
//     const supportHTML = `
//       <div class='flex gap-4'>
//       <h4 class="text-lg font-semibold mb-4 text-green-600">Support Levels</h4>
//         <button id="support_info" class="text-gray-400 hover:text-indigo-600 transition-colors hidden">
//           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
//           </svg>
//         </button>
//         </div>
        
//         <div class="space-y-3">
//           ${rec.support_levels
//         .map(level => `
//               <div class="flex justify-between items-center bg-green-50 p-3 rounded-lg">
//                 <div>
//                   <span class="font-medium">$${parseFloat(level.price).toFixed(2)}</span>
//                   <span class="text-sm text-green-500 ml-2">
//                     ${parseFloat(level.distance).toFixed(2)}% ${getTrendIcon("BULLISH")}
//                   </span>
//                 </div>
//                 <div class="text-sm text-green-700">Strength: ${parseFloat(level.strength).toFixed(2)}</div>
//               </div>
//             `)
//         .join("")}
//         </div>
//     `;
//     supportLevelsContainer.innerHTML = supportHTML;

//     // Compute strongest and weakest support & resistance levels.
//     // (For BUY trades: optimal = strongest resistance (TP) and strongest support (SL),
//     //  high risk = weakest resistance and weakest support.
//     //  For SELL trades, the roles of support/resistance are reversed.)
//     const strongestSupport = rec.support_levels.reduce((max, level) => level.strength > max.strength ? level : max, rec.support_levels[0]);
//     const weakestSupport = rec.support_levels.reduce((min, level) => level.strength < min.strength ? level : min, rec.support_levels[0]);
//     const strongestResistance = rec.resistance_levels.reduce((max, level) => level.strength > max.strength ? level : max, rec.resistance_levels[0]);
//     const weakestResistance = rec.resistance_levels.reduce((min, level) => level.strength < min.strength ? level : min, rec.resistance_levels[0]);

//     // Wallet Overview (kept as before)
//     const walletHTML = `
//       <!-- Wallet Overview -->
//       <div class='flex gap-4'>
//       <h4 class="text-base font-semibold flex items-center gap-2 text-gray-700">💰 Wallet Overview</h4>
//        <button id="wallet_info" class=" text-gray-400 hover:text-indigo-600 transition-colors">
//           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
//             stroke="currentColor">
//             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
//               d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//           </svg>
//         </button>
//       </div>
      
//       <div class="grid md:grid-cols-2 gap-3">
//         <!-- Current Balance -->
//         <div class="flex items-center gap-3">
//           <div class="p-2 bg-white rounded-lg border">👛</div>
//           <div>
//             <p class="text-sm text-gray-600">Current Balance</p>
//             <p class="text-lg font-semibold text-gray-800">${walletBalance} $</p>
//           </div>
//         </div>
//         <!-- Current Pair Value -->
//         <div class="flex items-center gap-3">
//           <div class="p-2 bg-white rounded-lg border">💹</div>
//           <div>
//             <p class="text-sm text-gray-600">Current Pair Value</p>
//             <p id="wallet_pair_value" class="text-lg font-semibold text-gray-800">${signal.price.toFixed(2)}</p>
//           </div>
//         </div>
//       </div>
    
//       <!-- Risk Management and Controls -->
//       <div class="bg-white p-2 rounded-lg border border-blue-200">
//         <div class="flex flex-col sm:flex-row items-center gap-2">
//           <!-- Risk Management Label -->
//           <div class="flex items-center gap-1">
//             <div class="p-1 bg-purple-100 rounded">⚠️</div>
//             <span class="text-sm font-bold text-gray-800">Risk Management</span>
//           </div>
//           <!-- Inline Risk Controls -->
//           <div class="flex flex-wrap items-center gap-1 ml-auto">
//             <!-- Risk Mode and Value -->
//             <select id="riskMode" class="px-1 py-1 border rounded text-xs">
//               <option value="percentage">Percentage</option>
//               <option value="amount">Amount</option>
//             </select>
//             <input type="number" id="riskValue" value="2" class="w-16 px-1 py-1 border rounded text-xs text-center" step="0.01">
//             <span id="riskUnit" class="text-gray-500 text-xs">%</span>
//             <!-- Coin Selector and Position Size (position size will be recalculated dynamically) -->
//             <select id="coinSelect" class="hidden px-1 py-1 border rounded text-xs">
//               <option value="BTC">₿ BTC</option>
//               <option value="ETH">Ξ ETH</option>
//             </select>
//             <input class="hidden" type="number" id="positionSize" value="0.0002" class="w-20 px-1 py-1 border rounded text-xs" step="0.000001">
//             <!-- Leverage -->
//             <select id="leverage" class="px-1 py-1 border rounded text-xs">
//               <option value="1">1x</option>
//               <option value="2">2x</option>
//               <option value="3">3x</option>
//               <option value="4">4x</option>
//               <option value="5">5x</option>
//               <option value="10">10x</option>
//               <option value="20">20x</option>
//             </select>
//           </div>
//         </div>
//       </div>
    
//       <!-- Helper Note -->
//       <div class="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
//         <div class="flex items-center gap-1">
//           <span class="text-yellow-600 text-xs">💡</span>
//           <span class="text-xs font-medium text-gray-700">Risk Calculation</span>
//         </div>
//         <p class="text-[10px] text-gray-600" id="calculationNote">
//           Risk Amount = (Risk Value ${'<span id="riskUnitDisplay">% or $</span>'}) × Balance ➔ Position Size = (Risk Amount / Price) × Leverage
//         </p>
//       </div>
//     `;
//     document.getElementById('wallet_overview').innerHTML = walletHTML;

//     // Function to update the dynamic trade recommendations based on risk inputs.
//     function updateTradeRecs() {
//       // Get current risk inputs:
//       const riskModeEl = document.getElementById('riskMode');
//       const riskValueEl = document.getElementById('riskValue');
//       const leverageEl = document.getElementById('leverage');
//       const posSizeEl = document.getElementById('positionSize');

//       const riskMode = riskModeEl.value;
//       const riskValue = parseFloat(riskValueEl.value) || 0;
//       const leverage = parseFloat(leverageEl.value) || 1;

//       // Update unit display in both places.
//       const riskUnitEl = document.getElementById('riskUnit');
//       riskUnitEl.textContent = (riskMode === 'percentage') ? '%' : '$';

//       // Calculate the risk amount.
//       let riskAmount = riskMode === 'percentage' ? (riskValue * walletBalance / 100) : riskValue;
//       // Calculate dynamic position size using the risk formula: (riskAmount / currentPrice) × leverage
//       const dynamicPosSize = (riskAmount / signal.price) * leverage;
//       // Optionally update the positionSize input (if you want it auto-updated)
//       posSizeEl.value = dynamicPosSize.toFixed(6);

//       // Recalculate the potential profit for each recommendation.
//       // For BUY trades, profit = dynamicPosSize × (TP - currentPrice)
//       // For SELL trades, profit = dynamicPosSize × (currentPrice - TP)
//       let optBuyTP = strongestResistance.price,
//         optBuySL = strongestSupport.price,
//         highBuyTP = weakestResistance.price,
//         highBuySL = weakestSupport.price,
//         optSellTP = strongestSupport.price,
//         optSellSL = strongestResistance.price,
//         highSellTP = weakestSupport.price,
//         highSellSL = weakestResistance.price;
//       let optProfit = 0, highProfit = 0, mirrorOptProfit = 0, mirrorHighProfit = 0;

//       if (rec.action === 'BUY' || rec.action === 'STRONG_BUY') {
//         optProfit = dynamicPosSize * (optBuyTP - signal.price);
//         highProfit = dynamicPosSize * (highBuyTP - signal.price);
//         // For mirror actions (sell recommendations for a BUY signal)
//         mirrorOptProfit = dynamicPosSize * (signal.price - optSellTP);
//         mirrorHighProfit = dynamicPosSize * (signal.price - highSellTP);
//       } else {
//         // For SELL recommendations:
//         optProfit = dynamicPosSize * (signal.price - optSellTP);
//         highProfit = dynamicPosSize * (signal.price - highSellTP);
//         mirrorOptProfit = dynamicPosSize * (optBuyTP - signal.price);
//         mirrorHighProfit = dynamicPosSize * (highBuyTP - signal.price);
//       }

//       // Build the Suggested Actions section with dynamic profits and rec data.
//       const recomendationHTML = `
//         <div class='flex gap-4 mb-3'>

//           <h4 class="text-base font-semibold  flex items-center gap-2 text-gray-700">🚀 Suggested Actions</h4>
//           <button id="actions_info" class=" text-gray-400 hover:text-indigo-600 transition-colors ">
//             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
//               stroke="currentColor">
//               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
//                 d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </button>

//           </div>

//         <div class="grid grid-cols-2 gap-3">
//           <div class="space-y-3">
//             <!-- Optimal Risk Buy/Sell -->
//             <div onclick="confirmAction('${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'Optimal Risk Buy' : 'Optimal Risk Sell'}')"
//               class="cursor-pointer bg-white p-3 rounded-lg border ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'border-green-200 hover:bg-green-100' : 'border-red-200 hover:bg-red-100'}">
//               <div class="flex items-center gap-1 ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'text-green-600' : 'text-red-600'} mb-1">
//                 <span>${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? '↑' : '↓'}</span>
//                 <span class="font-medium">Optimal Risk ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'Buy' : 'Sell'}</span>
//               </div>
//               ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY')
//           ? `<p class="text-sm">TP: $${optBuyTP.toFixed(2)} | SL: $${optBuySL.toFixed(2)}</p>
//                    <p class="text-lg font-semibold">Profit: $${optProfit.toFixed(2)}</p>`
//           : `<p class="text-sm">TP: $${optSellTP.toFixed(2)} | SL: $${optSellSL.toFixed(2)}</p>
//                    <p class="text-lg font-semibold">Profit: $${optProfit.toFixed(2)}</p>`
//         }
//             </div>
//             <!-- High Risk Buy/Sell -->
//             <div onclick="confirmAction('${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'High Risk Buy' : 'High Risk Sell'}')"
//               class="cursor-pointer bg-white p-3 rounded-lg border border-orange-200 hover:bg-orange-100">
//               <div class="flex items-center gap-1 text-orange-600 mb-1">
//                 <span>${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? '↑' : '↓'}</span>
//                 <span class="font-medium">High Risk ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'Buy' : 'Sell'}</span>
//               </div>
//               ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY')
//           ? `<p class="text-sm">TP: $${highBuyTP.toFixed(2)} | SL: $${highBuySL.toFixed(2)}</p>
//                    <p class="text-lg font-semibold">Profit: $${highProfit.toFixed(2)}</p>`
//           : `<p class="text-sm">TP: $${highSellTP.toFixed(2)} | SL: $${highSellSL.toFixed(2)}</p>
//                    <p class="text-lg font-semibold">Profit: $${highProfit.toFixed(2)}</p>`
//         }
//             </div>
//           </div>
//           <div class="space-y-3">
//             <!-- Mirror Actions (opposite direction) -->
//             <div onclick="confirmAction('${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'Optimal Risk Sell' : 'Optimal Risk Buy'}')"
//               class="cursor-pointer bg-white p-3 rounded-lg border ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'border-red-200 hover:bg-red-100' : 'border-green-200 hover:bg-green-100'}">
//               <div class="flex items-center gap-1 ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'text-red-600' : 'text-green-600'} mb-1">
//                 <span>${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? '↓' : '↑'}</span>
//                 <span class="font-medium">Optimal Risk ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'Sell' : 'Buy'}</span>
//               </div>
//               ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY')
//           ? `<p class="text-sm">TP: $${optSellTP.toFixed(2)} | SL: $${optSellSL.toFixed(2)}</p>
//                    <p class="text-lg font-semibold">Profit: $${mirrorOptProfit.toFixed(2)}</p>`
//           : `<p class="text-sm">TP: $${optBuyTP.toFixed(2)} | SL: $${optBuySL.toFixed(2)}</p>
//                    <p class="text-lg font-semibold">Profit: $${mirrorOptProfit.toFixed(2)}</p>`
//         }
//             </div>
//             <div onclick="confirmAction('${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'High Risk Sell' : 'High Risk Buy'}')"
//               class="cursor-pointer bg-white p-3 rounded-lg border border-orange-200 hover:bg-orange-100">
//               <div class="flex items-center gap-1 text-orange-600 mb-1">
//                 <span>${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? '↓' : '↑'}</span>
//                 <span class="font-medium">High Risk ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY') ? 'Sell' : 'Buy'}</span>
//               </div>
//               ${(rec.action === 'BUY' || rec.action === 'STRONG_BUY')
//           ? `<p class="text-sm">TP: $${highSellTP.toFixed(2)} | SL: $${highSellSL.toFixed(2)}</p>
//                    <p class="text-lg font-semibold">Profit: $${mirrorHighProfit.toFixed(2)}</p>`
//           : `<p class="text-sm">TP: $${highBuyTP.toFixed(2)} | SL: $${highBuySL.toFixed(2)}</p>
//                    <p class="text-lg font-semibold">Profit: $${mirrorHighProfit.toFixed(2)}</p>`
//         }
//             </div>
//           </div>
//         </div>
//       `;

//       // AI Recommendations (if risk_reward_ratio exists)
//       let aiRecommendsHTML = "";
//       if (rec.risk_reward_ratio) {
//         const secureTP = rec.take_profit_1;
//         const bestTP = rec.take_profit_2;
//         const secureProfit = (rec.action === "BUY" || rec.action === "STRONG_BUY")
//           ? dynamicPosSize * (secureTP - signal.price)
//           : dynamicPosSize * (signal.price - secureTP);
//         const bestRewardProfit = (rec.action === "BUY" || rec.action === "STRONG_BUY")
//           ? dynamicPosSize * (bestTP - signal.price)
//           : dynamicPosSize * (signal.price - bestTP);
//         aiRecommendsHTML = `
//           <div class="mt-4">
//             <h4 class="text-base font-semibold mb-3 flex items-center gap-2 text-gray-700">🤖 AI Recommends</h4>
//             <div class="grid grid-cols-2 gap-3">
//               <div onclick="confirmAction('Secure Trade')"
//                 class="cursor-pointer bg-white p-3 rounded-lg border border-teal-200 hover:bg-teal-100">
//                 <div class="flex items-center gap-1 text-teal-600 mb-1">
//                   <span>🔒</span><span class="font-medium">Secure Trade</span>
//                 </div>
//                 <p class="text-sm">TP: $${secureTP.toFixed(2)} | SL: $${rec.stop_loss.toFixed(2)}</p>
//                 <p class="text-lg font-semibold">Profit: $${secureProfit.toFixed(2)}</p>
//               </div>
//               <div onclick="confirmAction('Best Reward Trade')"
//                 class="cursor-pointer bg-white p-3 rounded-lg border border-purple-200 hover:bg-purple-100">
//                 <div class="flex items-center gap-1 text-purple-600 mb-1">
//                   <span>🏆</span><span class="font-medium">Best Reward</span>
//                 </div>
//                 <p class="text-sm">TP: $${bestTP.toFixed(2)} | SL: $${rec.stop_loss.toFixed(2)}</p>
//                 <p class="text-lg font-semibold">Profit: $${bestRewardProfit.toFixed(2)}</p>
//               </div>
//             </div>
//           </div>
//         `;
//       }

//       // Combine recommendations with AI recommends and update the container.
//       document.getElementById('recomendations').innerHTML = recomendationHTML + aiRecommendsHTML;


//     } // end updateTradeRecs

//     // Initial call to update trade recommendations based on default risk management parameters.
//     updateTradeRecs();

//     // Add event listeners so that changes in risk parameters update the recommendations dynamically.
//     document.getElementById('riskMode').addEventListener('change', updateTradeRecs);
//     document.getElementById('riskValue').addEventListener('input', updateTradeRecs);
//     document.getElementById('leverage').addEventListener('change', updateTradeRecs);

//     // Build Resistance Levels
//     const resistanceHTML = `
//         <h4 class="text-lg font-semibold mb-4 text-red-600">Resistance Levels</h4>
//         <div class="space-y-3">
//           ${rec.resistance_levels
//         .map(level => `
//               <div class="flex justify-between items-center bg-red-50 p-3 rounded-lg">
//                 <div>
//                   <span class="font-medium">$${parseFloat(level.price).toFixed(2)}</span>
//                   <span class="text-sm text-red-500 ml-2">
//                     ${Math.abs(parseFloat(level.distance)).toFixed(2)}% ${getTrendIcon("BEARISH")}
//                   </span>
//                 </div>
//                 <div class="text-sm text-red-700">Strength: ${parseFloat(level.strength).toFixed(2)}</div>
//               </div>
//             `)
//         .join("")}
//         </div>
//     `;
//     resistanceLevelsContainer.innerHTML = resistanceHTML;

//     // Build Trading Notes
//     const notesHTML = `
//         <h4 class="text-lg font-semibold text-yellow-800 mb-2">Trading Notes</h4>
//         <p class="text-yellow-800">${rec.notes}</p>
//     `;
//     tradingNotesContainer.innerHTML = notesHTML;

//     // Build additional components (if any)
//     const componentsHTML = getComponentsHTML(fetchedData.signal.components);
//     componentsContent.innerHTML = componentsHTML;

//     // Optional: Update risk unit display in helper note if needed.
//     document.getElementById('riskMode').addEventListener('change', function () {
//       // This additional listener updates any extra unit displays if you want.
//       document.getElementById('riskUnit').textContent = (this.value === 'percentage') ? '%' : '$';
//     });
//   }


  function init() {
    fetchBtn.addEventListener("click", async function () {
      // fetchBtn.textContent = "Loading...";
      fetchBtn.innerHTML = `<div class="loading-wave h-[10px]">
  <div class="loading-bar"></div>
  <div class="loading-bar"></div>
  <div class="loading-bar"></div>
  <div class="loading-bar"></div>
</div>`;

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




// loading 

function showLoading() {
  const loading = document.getElementById('globalLoading');
  loading.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // prevent scroll
  document.body.style.pointerEvents = 'none'; // prevent interaction
}

function hideLoading() {
  const loading = document.getElementById('globalLoading');
  loading.classList.add('hidden');
  document.body.style.overflow = ''; // restore scroll
  document.body.style.pointerEvents = ''; // restore interaction
}





// news components 


// class CryptoDataComponent {
//   constructor(userToken, coinPair, parentElement) {
//     this.userToken = userToken;
//     this.coinPair = coinPair;
//     this.parentElement = parentElement;
//     this.data = null;
//   }

//   async fetchData() {
//     try {
//       console.log('news component test', this.coinPair);

//       const params = { name: this.coinPair };
//       const response = await axios.post(
//         "https://news.imoonex.ir/AimoonxNewsHUB/Symbols/ex_getSymbolInfo/",
//         params,
//         {
//           headers: {
//             Accept: "application/json",
//             "Content-Type": "application/json; charset=utf-8",
//             Authorization: this.userToken,
//           },
//         }
//       );
//       this.data = response.data.data[0];
//       this.render();
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       this.parentElement.innerHTML = `<div class="p-4 text-red-500">Error loading data</div>`;
//     }
//   }


//   createDampChart(elementId) {


//     const { daily_timeseries } = this.data;



//     let new_timestamp = daily_timeseries.timestamp.map(t => t * 1000)


//     return new ApexCharts(document.querySelector(elementId), {
//       chart: {
//         type: 'line',
//         height: 350,
//         toolbar: { show: true }
//       },
//       series: [
//         { name: 'DAMP 5', data: daily_timeseries.damp_5 },
//         { name: 'DAMP 10', data: daily_timeseries.damp_10 },
//         { name: 'DAMP 15', data: daily_timeseries.damp_15 },
//         { name: 'DAMP 20', data: daily_timeseries.damp_20 },
//         { name: 'DAMP 30', data: daily_timeseries.damp_30 },

//         // { name: 'DAMP 25', data: daily_timeseries.damp_25 },

//       ],
//       xaxis: {
//         type: 'datetime',
//         categories: new_timestamp
//       },
//       yaxis: { title: { text: 'DAMP Values' } },
//       stroke: { width: 2, curve: 'smooth' },
//       colors: ['#3B82F6', '#10B981', '#D5D1D8', '#FF6178',],
//       tooltip: {
//         x: { format: 'dd MMM yyyy' }
//       }
//     });
//   }

//   createNewsCountChart(elementId) {
//     const { daily_timeseries } = this.data;


//     let new_timestamp = daily_timeseries.timestamp.map(t => t * 1000)

//     return new ApexCharts(document.querySelector(elementId), {
//       chart: {
//         type: 'bar',
//         height: 350,
//         toolbar: { show: true }
//       },
//       series: [{ name: 'News Count', data: daily_timeseries.newsCount }],
//       xaxis: {
//         type: 'datetime',
//         categories: new_timestamp
//       },
//       yaxis: { title: { text: 'News Count' } },
//       colors: ['#F59E0B'],
//       plotOptions: {
//         bar: { columnWidth: '80%' }
//       },
//       tooltip: {
//         x: { format: 'dd MMM yyyy' }
//       }
//     });
//   }

//   createSentimentDonut(elementId) {
//     const s = this.data.latest_news_info.last_week_sentiment;
//     return new ApexCharts(document.querySelector(elementId), {
//       chart: {
//         type: 'donut',
//         height: 250,
//         animations: { enabled: false }
//       },
//       series: [s.positive * 100, s.negative * 100, s.neutral * 100],
//       labels: ['Positive', 'Negative', 'Neutral'],
//       legend: { position: 'bottom' },
//       dataLabels: { enabled: false },
//       colors: ['#10B981', '#EF4444', '#64748B'],
//       plotOptions: {
//         pie: {
//           donut: {
//             labels: {
//               show: true,
//               total: {
//                 show: true,
//                 label: 'Sentiment',
//                 formatter: () => '100%'
//               }
//             }
//           }
//         }
//       }
//     });
//   }

//   render() {
//     const { latest_price_info, latest_news_info } = this.data;

//     console.log("news data :" , latest_news_info);


//     this.parentElement.innerHTML = `



//       <!-- Stats Grid -->
//       <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//         <!-- News Stats with Donut -->
//         <div class="bg-white p-6 rounded-lg shadow-md">
//           <h3 class="text-xl font-semibold mb-4">News Statistics</h3>
//           <div class="space-y-4">
//             <div>24H News: ${latest_news_info.last_day_count}</div>
//             <div>7D Avg: ${latest_news_info.avg_news_week}</div>
//             <div id="sentimentChart"></div>
//           </div>
//         </div>



//       <!-- DAMP Chart -->
//       <div id="dampChart" class="bg-white p-6 rounded-lg shadow-md "></div>

//       </div>


//       <!-- News Count Chart -->
//       <div id="newsCountChart" class="bg-white p-6 rounded-lg shadow-md"></div>
//     `;

//     // Render charts after DOM update
//     setTimeout(() => {
//       this.createSentimentDonut('#sentimentChart').render();
//       this.createDampChart('#dampChart').render();
//       // this.createNewsCountChart('#newsCountChart').render();
//     }, 100);
//   }
// }
class CryptoDataComponent {
  constructor(userToken, coinPair, parentElement) {
    this.userToken = userToken;
    this.coinPair = coinPair;
    this.parentElement = parentElement;
    this.data = null;
    this.newsChart = null;
    this.newsAnalysis = JSON.parse(localStorage.getItem('newsAnalysis'));
    this.fetchData = this.fetchData.bind(this);
  }

  async fetchData() {
    try {
      const response = await axios.post(
        ex_getSymbolInfo,
        { name: this.coinPair },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
            Authorization: this.userToken
          }
        }
      );
      this.data = response.data.data[0];
      this.render();
    } catch (error) {
      console.error('Data fetch error:', error);
      this.parentElement.innerHTML = `
        <div class="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>Load error. </span>
          <button class="text-blue-600 underline" onclick="this.closest('[data-component]').querySelector('button').click()">
            Retry
          </button>
        </div>`;
    }
  }

  createDampChart(elementId) {
    const { daily_timeseries } = this.data;
    return new ApexCharts(document.querySelector(elementId), {
      chart: {
        type: 'line',
        height: '100%',
        zoom: { enabled: true },
        toolbar: { show: true, tools: { download: false } }
      },
      series: [
        { name: 'DAMP 5', data: daily_timeseries.damp_5 },
        { name: 'DAMP 10', data: daily_timeseries.damp_10 },
        { name: 'DAMP 15', data: daily_timeseries.damp_15 },
        { name: 'DAMP 20', data: daily_timeseries.damp_20 },
        { name: 'DAMP 30', data: daily_timeseries.damp_30 }
      ],
      xaxis: { type: 'datetime', categories: daily_timeseries.timestamp.map(t => t * 1000) },
      stroke: { width: 1.5, curve: 'smooth' },
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#64748B'],
      tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy HH:mm' } }
    });
  }

  createNewsCountChart(elementId) {
    const { daily_timeseries } = this.data;
    const raw = daily_timeseries.timestamp
      .map((t, i) => ({ t: t * 1000, count: daily_timeseries.newsCount[i] }))
      .filter(pt => pt.t >= Date.now() - 7 * 86400000);

    let zoomTimeout;
    const zoomHandler = (_chartCtx, { xaxis }) => {
      clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        const { min, max } = xaxis;
        const groupMs = (max - min) <= 86400000 ? 3600000 : 86400000;
        const bins = {};
        raw.filter(pt => pt.t >= min && pt.t <= max).forEach(pt => {
          const bucket = Math.floor(pt.t / groupMs) * groupMs;
          bins[bucket] = (bins[bucket] || 0) + pt.count;
        });
        this.newsChart.updateOptions({ series: [{ data: Object.entries(bins).map(([k, v]) => [Number(k), v]) }] });
      }, 300);
    };

    this.newsChart = new ApexCharts(document.querySelector(elementId), {
      chart: {
        type: 'bar',
        height: '100%',
        toolbar: { show: true, tools: { download: false } },
        zoom: { enabled: true },
        events: { zoomed: zoomHandler }
      },
      series: [{ name: 'News Count', data: raw.map(pt => [pt.t, pt.count]) }],
      xaxis: { type: 'datetime' },
      plotOptions: { bar: { columnWidth: '60%' } },
      dataLabels: { enabled: false },
      tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy HH:mm' } }
    });
    return this.newsChart;
  }

  createSentimentDonut(elementId, sentimentData, title) {
    const hasData = sentimentData.positive || sentimentData.negative || sentimentData.neutral;
    return new ApexCharts(document.querySelector(elementId), {
      chart: { type: 'donut', height: 160, animations: { enabled: false } },
      series: hasData ? [
        sentimentData.positive * 100,
        sentimentData.negative * 100,
        sentimentData.neutral * 100
      ] : [],
      labels: ['Positive', 'Negative', 'Neutral'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              name: { show: true },
              value: {
                show: true,
                formatter: (val) => Math.round(val) + '%'
              },
              total: {
                show: true,
                label: title,
                formatter: () => '100%'
              }
            }
          }
        }
      },
      colors: ['#10B981', '#EF4444', '#64748B'],
      tooltip: { 
        theme: 'dark',
        y: {
          formatter: (value) => Math.round(value) + '%'
        }
      }
    });
  }
  

  render() {
    let analysisSection = '';
    if (this.newsAnalysis) {
      const na = this.newsAnalysis;
      analysisSection = `
        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-4">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-800">Fundamental Analysis</h3>
              <p class="text-xs text-gray-500">Last updated: ${new Date(na.updatedAt * 1000).toLocaleDateString()}</p>
            </div>
            <span class="px-2 py-1 rounded-full text-xs font-medium ${na.decision === 'خرید' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
              ${na.decision} ${na.decision === 'خرید' ? '↗' : '↘'}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs mb-3">
            <div class="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded">
              <span class="text-gray-400">🌐</span>
              <span class="font-medium text-gray-600">Pair:</span>
              <span class="text-gray-800">${na.pair}</span>
            </div>
            <div class="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded">
              <span class="text-gray-400">📊</span>
              <span class="font-medium text-gray-600">Pattern:</span>
              <span class="text-gray-800">${na.pattern}</span>
            </div>
            <div class="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded">
              <span class="text-gray-400">⏳</span>
              <span class="font-medium text-gray-600">Duration:</span>
              <span class="text-gray-800">${na.duration}</span>
            </div>
            <div class="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded">
              <span class="text-gray-400">🔄</span>
              <span class="font-medium text-gray-600">Volatility:</span>
              <span class="text-gray-800">${na.volatility || 'N/A'}</span>
            </div>
          </div>

          <details class="group [&_summary::-webkit-details-marker]:hidden">
            <summary class="flex items-center justify-between p-1.5 cursor-pointer hover:bg-gray-50 rounded">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                </svg>
                <span class="text-xs font-medium text-gray-700">Analysis Details</span>
              </div>
              <svg class="w-5 h-5 text-gray-400 transform transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </summary>
            <div class="mt-2 pt-2 border-t border-gray-100">
              <p class="text-xs text-gray-600 leading-5">${na.analyse}</p>
              <details class="mt-2 group">
                <summary class="flex items-center gap-2 p-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50 rounded">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                  </svg>
                  Related News (${na.news.length})
                </summary>
                <ul class="mt-1.5 pl-4 space-y-1.5 text-xs text-gray-600">
                  ${na.news.map(item => `
                    <li class="relative before:absolute before:-left-4 before:top-2 before:w-1.5 before:h-1.5 before:bg-gray-300 before:rounded-full">
                      ${item}
                    </li>
                  `).join('')}
                </ul>
              </details>
            </div>
          </details>
        </div>`;
    }

    const { latest_news_info = {} } = this.data || {};
    const daySent = latest_news_info.last_day_sentiment || {};
    const weekSent = latest_news_info.last_week_sentiment || {};
    const showDay = daySent.positive || daySent.negative || daySent.neutral;
    const showWeek = weekSent.positive || weekSent.negative || weekSent.neutral;

    this.parentElement.innerHTML = `
      <div class="space-y-4" data-component>
        ${analysisSection}

        <div class="grid gap-4 md:grid-cols-3">
          ${showDay || showWeek ? `
            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                <h3 class="text-sm font-semibold text-gray-800">Market Sentiment</h3>
              </div>
              ${showDay ? `<div id="sentimentDayChart" class="-mx-1"></div>` : ''}
              ${showWeek ? `<div id="sentimentWeekChart" class="-mx-1 mt-4"></div>` : ''}
            </div>` : ''}
          
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm md:col-span-2">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <h3 class="text-sm font-semibold text-gray-800">DAMP Trends</h3>
            </div>
            <div id="dampChart" class="h-80"></div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="text-sm font-semibold text-gray-800">News Frequency</h3>
          </div>
          <div id="newsCountChart" class="h-64"></div>
        </div>
      </div>`;

    if (this.data) {
      if (showDay) this.createSentimentDonut('#sentimentDayChart', daySent, '24H').render();
      if (showWeek) this.createSentimentDonut('#sentimentWeekChart', weekSent, '7D').render();
      this.createDampChart('#dampChart').render();
      this.createNewsCountChart('#newsCountChart').render();
    }
  }
}

// draggable modal 
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("modal-wrapper");
  const header = document.getElementById("draggable-header");
  const drawer = document.getElementById("left-drawer");
  const toggleBtn = document.getElementById("drawer-toggle");


  // Drawer toggle
  let open = false;
  toggleBtn.addEventListener("click", () => {
    open = !open;
    drawer.classList.toggle("translate-x-full", !open);
    document.getElementById('drawer_svg').classList.toggle('rotate-180')
  });

  // Drag logic
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  header.addEventListener("pointerdown", (e) => {
    isDragging = true;
    const rect = wrapper.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    wrapper.style.left = `${rect.left}px`;
    wrapper.style.top = `${rect.top}px`;
    wrapper.style.right = "auto";
    wrapper.style.position = "fixed";

    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", dragMove);
    document.addEventListener("pointerup", dragEnd);
  });

  function dragMove(e) {
    if (!isDragging) return;
    wrapper.style.left = `${e.clientX - offsetX}px`;
    wrapper.style.top = `${e.clientY - offsetY}px`;
  }

  function dragEnd() {
    isDragging = false;
    document.body.style.userSelect = "";
    document.removeEventListener("pointermove", dragMove);
    document.removeEventListener("pointerup", dragEnd);
  }
});



