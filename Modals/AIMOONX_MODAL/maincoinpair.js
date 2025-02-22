// import ApexCharts from 'apexcharts'
let params = new URLSearchParams(window.location.search);
let id = params.get("id");
console.log(id); // Outputs: "Foo Bar"

// Array to store historical prices (we'll store up to 20 points)
const priceHistory = [];
const maxDataPoints = 20;

// // Setup Chart.js chart
// const ctx = document.getElementById('priceChart').getContext('2d');
// const priceChart = new Chart(ctx, {
//   type: 'line',
//   data: {
//     labels: [], // Timestamps will be added here
//     datasets: [{
//       label: 'Price',
//       data: [],
//       backgroundColor: 'rgba(16, 185, 129, 0.2)', // green-500
//       borderColor: 'rgba(16, 185, 129, 1)',
//       borderWidth: 2,
//       tension: 0.3,
//       fill: true
//     }]
//   },
//   options: {
//     responsive: true,
//     scales: {
//       x: {
//         type: 'time',
//         time: { unit: 'second' },
//         title: { display: true, text: 'Time' }
//       },
//       y: {
//         title: { display: true, text: 'Price ($)' }
//       }
//     }
//   }
// });

async function fetchCoinList() {
  const url = "http://188.34.202.221:8000/Market/GetMarketPair/";
  const token = "6ae3d79118083127c5442c7c6bfaf0b9";
  const params = { marketpair_id: id };
  try {
    axios.post(url, params, {
      headers: {
        'Accept': "application/json",
        'Authorization': token,
      },
    })
      .then(response => {
        const data = response.data.market_pair;
        if (data) {
          // Update data cards
          document.getElementById('pairName').textContent = data.pair.name;
          document.getElementById('price').textContent = data.formatted_price;
          document.getElementById('askPrice').textContent = data.ask_price;
          document.getElementById('bidPrice').textContent = data.bid_price;
          document.getElementById('volume').textContent = parseFloat(data.volume).toFixed(2);
          document.getElementById('changePrice').textContent = data.change_price;
          document.getElementById('changeRate').textContent = data.change_rate;
          if (data.pair.src) {
            document.getElementById('srcCoinName').textContent = `${data.pair.src.name} (${data.pair.src.symbol})`;
            document.getElementById('srcLogo').src = data.pair.src.logo_url;
          }
          if (data.pair.base) {
            document.getElementById('baseCoinName').textContent = `${data.pair.base.name} (${data.pair.base.symbol})`;
            document.getElementById('baseLogo').src = data.pair.base.logo_url;
          }
          document.getElementById('openPrice').textContent = data.open_price;
          document.getElementById('closePrice').textContent = data.close_price;
          document.getElementById('highPrice').textContent = data.high_price;
          document.getElementById('lowPrice').textContent = data.low_price;

          // Update chart: use the main price (formatted_price) as our data point
          const currentPrice = parseFloat(data.price);
          const currentTime = new Date();

          // Add new data point
          priceHistory.push({ time: currentTime, price: currentPrice });
          // Limit array length
          if (priceHistory.length > maxDataPoints) {
            priceHistory.shift();
          }

          // // Update chart labels and data arrays
          // priceChart.data.labels = priceHistory.map(point => point.time);
          // priceChart.data.datasets[0].data = priceHistory.map(point => point.price);
          // priceChart.update();
        }
      })
      .catch(error => {
        console.error("Error making request:", error);
      });
  } catch (error) {
    console.error("Error fetching coin list:", error);
  }
}

// Initial call and repeat every 2 seconds
fetchCoinList();
setInterval(fetchCoinList, 10000);









// candle chart 

const token = "6ae3d79118083127c5442c7c6bfaf0b9";
let activeMarkets = [];
let currentMarketId = null;
let candleChart = null;

// Fetch active markets from the API
async function fetchActiveMarkets() {
  try {
    const response = await axios.get("http://188.34.202.221:8000/Pair/ListPairs/", {
      headers: {
        'Accept': "application/json",
        'Authorization': token,
      },
    });
    if (response.data.return) {
      activeMarkets = response.data.pairs;


      populateMarketSelect();
    }
  } catch (error) {
    console.error("Error fetching active markets:", error);
  }
}

// Populate the market select dropdown
function populateMarketSelect() {
  const select = document.getElementById('marketSelect');
  select.innerHTML = ""; // Clear previous options
  activeMarkets.forEach(market => {
    const option = document.createElement('option');
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

let time_interval_for_chart = 5000

// Update the market info display
function updateMarketInfo(market) {
  document.getElementById('marketName').textContent = market.name;
  document.getElementById('marketDesc').textContent = market.desc || "";
}

// Fetch OHLCV data using provided parameters and update candlestick chart
async function fetchOHLCVData() {
  const marketpair_id = currentMarketId;
  console.log(marketpair_id);

  const timeframe = document.getElementById('timeframe').value;

  // const since = document.getElementById('since').value;
  const limit = parseInt(document.getElementById('limit').value);
  const since = getDate(limit, timeframe);

  try {


    let chart_type = document.getElementById('chart_type').checked;
    let url

    if (chart_type) {


      url = "http://188.34.202.221:8000/Market/exGetTrendWithOHLCV/"
      document.getElementById('advanced_chart_tools').classList.remove('hidden')


    } else {
      url = "http://188.34.202.221:8000/Market/exGetOHLCV/"
      document.getElementById('advanced_chart_tools').classList.add('hidden')

    }


    const response = await axios.post(url, {
      marketpair_id,
      timeframe,
      since,
      limit
    }, {
      headers: {
        'Accept': "application/json",
        'Authorization': token,
      },
    });

    console.log(response);




    if (response.data.return) {

      let ohlcv = response.data.data;


      if (chart_type) {


        ohlcv = response.data.data;
        time_interval_for_chart = 10000


      } else {
        ohlcv = response.data.ohlcv;
        time_interval_for_chart = 10000
      }


      return ohlcv



      // console.log(ohlcv, time_interval_for_chart);


      // // const ohlcv = response.data.ohlcv;

      // // Transform OHLCV data for the candlestick chart plugin
      // let candleData = ohlcv.map(item => ({
      //   x: new Date(item.timestamp),
      //   o: item.open,
      //   h: item.high,
      //   l: item.low,
      //   c: item.close
      // }));
      // // candleData.push({
      // //   x: new Date(),
      // //   o: 97000,
      // //   h: 97000,
      // //   l: 97000,
      // //   c: 97000
      // // })

      // updateCandleChart(ohlcv);
    }
  } catch (error) {
    console.error("Error fetching OHLCV data:", error);
  }
}
// Global state variables
let chart, volumeChart;
let drawnLines = []; // Each drawn line: { price, alertOn, alertTriggered }
let drawingMode = false;
let alertDrawingMode = false; // When true, drawn lines will have alerts enabled
let newsMode = false; // News mode toggle
let fetchedNews = null; // Cache for fetched news
// Preserve zoom state
let currentXMin = null, currentXMax = null, currentYMin = null, currentYMax = null;
let macdlastsignal = 0;
let currentCandleCount = 0;
let currentVolumeCount = 0;

// Create a simple removal modal using Tailwind CSS if not already present.
if (!document.getElementById("removal-modal")) {
  const modal = document.createElement("div");
  modal.id = "removal-modal";
  modal.className =
    "fixed inset-0 flex items-center justify-center z-50 hidden";
  modal.innerHTML = `
    <div class="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-50">
      <h3 class="text-xl font-bold mb-4">Remove drawn lines</h3>
      <p id="modal-lines" class="text-gray-700 mb-4"></p>
      <input id="remove-input" type="text" placeholder="Enter line numbers (e.g., 1,3)"
        class="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <div class="flex justify-end space-x-2">
        <button id="cancel-remove" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none">Cancel</button>
        <button id="confirm-remove" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none">Remove</button>
      </div>
    </div>
    <div class="absolute inset-0 bg-black opacity-50 pointer-events-none"></div>
  `;
  document.body.appendChild(modal);
}

// Create a news modal if not already present.
if (!document.getElementById("news-modal")) {
  const newsModal = document.createElement("div");
  newsModal.id = "news-modal";
  newsModal.className =
    "fixed inset-0 flex items-center justify-center z-50 hidden";
  newsModal.innerHTML = `
    <div class="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6 z-50">
      <h3 class="text-xl font-bold mb-4">News Details</h3>
      <div id="news-content" class="mb-4"></div>
      <div class="flex justify-end">
        <button id="close-news-modal" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none">Close</button>
      </div>
    </div>
    <div class="absolute inset-0 bg-black opacity-50 pointer-events-none"></div>
  `;
  document.body.appendChild(newsModal);
  const closeNewsBtn = document.getElementById("close-news-modal");
  if (closeNewsBtn) {
    closeNewsBtn.addEventListener("click", function () {
      document.getElementById("news-modal").classList.add("hidden");
    });
  }
}

// Toggle the article description between clamped (3 lines) and full view.
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




// Returns a sentiment indicator string (using arrows) for a news item.
function getSentimentIndicator(news) {
  let pos = (news.Positive !== undefined && news.Positive !== null) ? news.Positive : 0;
  let neu = (news.Neutral !== undefined && news.Neutral !== null) ? news.Neutral : 0;
  let neg = (news.Negative !== undefined && news.Negative !== null) ? news.Negative : 0;
  let maxVal = Math.max(pos, neu, neg);
  if (maxVal === 0) return '-';
  if (maxVal === pos) {
    return `<span class="text-green-500 font-bold">▲ ${pos}</span>`;
  } else if (maxVal === neg) {
    return `<span class="text-red-500 font-bold">▼ ${neg}</span>`;
  } else {
    return `<span class="text-gray-500 font-bold">→ ${neu}</span>`;
  }
}


function showNewsModal(relatedNews) {
  let newsContent = document.getElementById("news-content");
  if (!newsContent) return;
  
  // Limit initial display to five items.
  let initialItems = relatedNews.slice(0, 5);
  let extraItems = relatedNews.slice(5);
  let html = "";
  
  initialItems.forEach((news, index) => {
    html += `
      <div class="flex items-center p-2 border rounded-md bg-gray-50 text-xs mb-2">
        <!-- News image -->
        <div class="w-16 h-16 flex-shrink-0 mr-2">
          <img src="${news.thImage}" alt="news image" class="w-full h-full object-cover rounded-md">
        </div>
        <!-- News text -->
        <div class="flex-1">
          <h4 class="font-bold">${index + 1}. ${news.title}</h4>
          <p class="news-description" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${news.articleBody}
          </p>
          ${news.articleBody && news.articleBody.length > 100 ? `<button class="show-more text-blue-500 underline" onclick="toggleDescription(this)">Show More</button>` : ""}
          <a href="${news.link}" target="_blank" class="text-blue-500 underline">Read more</a>
        </div>
        <!-- Sentiment indicator -->
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
            ${news.articleBody && news.articleBody.length > 100 ? `<button class="show-more text-blue-500 underline" onclick="toggleDescription(this)">Show More</button>` : ""}
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
// Build annotations for drawn lines, support/resistance, and Fibonacci.
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
      let sr = [
        { label: "S1", value: lastCandle.S1 },
        { label: "S2", value: lastCandle.S2 },
        { label: "S3", value: lastCandle.S3 },
        { label: "R1", value: lastCandle.R1 },
        { label: "R2", value: lastCandle.R2 },
        { label: "R3", value: lastCandle.R3 },
      ];
      sr.forEach((item) => {
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
      let fib = [
        { label: "FIB_S3", value: lastCandle.FIB_S3 },
        { label: "FIB_S2", value: lastCandle.FIB_S2 },
        { label: "FIB_S1", value: lastCandle.FIB_S1 },
        { label: "FIB_PP", value: lastCandle.FIB_PP },
        { label: "FIB_R1", value: lastCandle.FIB_R1 },
        { label: "FIB_R2", value: lastCandle.FIB_R2 },
        { label: "FIB_R3", value: lastCandle.FIB_R3 },
      ];
      fib.forEach((item) => {
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

// Update annotations.
async function updateAnnotationsWrapper(data) {
  try {
    let ann = { yaxis: getAnnotations(data) };
    chart.updateOptions({ annotations: ann });
  } catch (err) {
    console.error("Error updating annotations:", err);
  }
}

// Main updateChart function.
async function updateChart() {
  try {
    let data = await fetchOHLCVData();
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn("No OHLCV data available.");
      return;
    }
    // If the candle count has changed (e.g. timeframe change), reset zoom state.
    if (data.length !== currentCandleCount) {
      currentXMin = null;
      currentXMax = null;
      currentYMin = null;
      currentYMax = null;
    }
    // Get the start date from the first candle.
    let firstCandleTime = Math.floor(new Date(data[0].datetime).getTime() / 1000);

    // --- Fetch news if not already fetched ---
    if (!fetchedNews) {
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
          fetchedNews = newsResponse.data.data;
        }
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    }

    // Prepare candlestick and volume data.
    let candlestickData = data.map((d) => ({
      x: new Date(d.datetime),
      y: [d.open, d.high, d.low, d.close],
    }));
    let bullishColor = document.getElementById("bullish-color")
      ? document.getElementById("bullish-color").value
      : "#008000";
    let bearishColor = document.getElementById("bearish-color")
      ? document.getElementById("bearish-color").value
      : "#ff0000";
    let volumeData = data.map((d) => ({
      x: new Date(d.datetime),
      y: d.volume,
      fillColor: d.close > d.open ? bullishColor : bearishColor,
    }));

    // Compute extra x-axis spacing.
    let newXMax = null;
    if (candlestickData.length >= 2) {
      let lastTime = candlestickData[candlestickData.length - 1].x.getTime();
      let secondLastTime = candlestickData[candlestickData.length - 2].x.getTime();
      let diff = lastTime - secondLastTime;
      newXMax = lastTime + diff * 5;
    }
    // Build series.
    let series = [
      { name: "Candlestick", type: "candlestick", data: candlestickData },
    ];
    const smaToggle = document.getElementById("show-sma");
    if (smaToggle && smaToggle.checked) {
      let smaData = [];
      for (let i = 19; i < data.length; i++) {
        smaData.push({ x: new Date(data[i].datetime), y: data[i].SMA_20 });
      }
      series.push({ name: "SMA_20", type: "line", data: smaData });
    }
    const emaToggle = document.getElementById("show-ema");
    if (emaToggle && emaToggle.checked) {
      let emaData = [];
      for (let i = 19; i < data.length; i++) {
        emaData.push({ x: new Date(data[i].datetime), y: data[i].EMA_20 });
      }
      series.push({ name: "EMA_20", type: "line", data: emaData });
    }

    // Update the candlestick chart.
    if (
      chart &&
      chart.w &&
      chart.w.config &&
      chart.w.config.series &&
      chart.w.config.series.length > 0 &&
      chart.w.config.series[0].data &&
      chart.w.config.series[0].data.length === candlestickData.length
    ) {
      let idx = candlestickData.length - 1;
      chart.w.config.series[0].data[idx] = candlestickData[idx];
      if (smaToggle && smaToggle.checked) {
        let smaSeries = chart.w.config.series.find((s) => s.name === "SMA_20");
        if (smaSeries && smaSeries.data && smaSeries.data.length > 0) {
          smaSeries.data[smaSeries.data.length - 1] = {
            x: new Date(data[data.length - 1].datetime),
            y: data[data.length - 1].SMA_20,
          };
        }
      }
      if (emaToggle && emaToggle.checked) {
        let emaSeries = chart.w.config.series.find((s) => s.name === "EMA_20");
        if (emaSeries && emaSeries.data && emaSeries.data.length > 0) {
          emaSeries.data[emaSeries.data.length - 1] = {
            x: new Date(data[data.length - 1].datetime),
            y: data[data.length - 1].EMA_20,
          };
        }
      }
      chart.updateSeries(chart.w.config.series, true).catch((err) =>
        console.error("Error in partial series update:", err)
      );
    } else {
      chart.updateSeries(series, true).catch((err) =>
        console.error("Error in full series update:", err)
      );
      currentCandleCount = candlestickData.length;
    }
    // Update volume chart.
    let volSeries = [{ name: "Volume", type: "bar", data: volumeData }];
    if (
      volumeChart &&
      volumeChart.w &&
      volumeChart.w.config &&
      volumeChart.w.config.series &&
      volumeChart.w.config.series.length > 0 &&
      volumeChart.w.config.series[0].data &&
      volumeChart.w.config.series[0].data.length === volumeData.length
    ) {
      let vidx = volumeData.length - 1;
      volumeChart.w.config.series[0].data[vidx] = volumeData[vidx];
      volumeChart.updateSeries(volumeChart.w.config.series, true).catch((err) =>
        console.error("Error updating volume chart partially:", err)
      );
    } else {
      volumeChart.updateSeries(volSeries, true).catch((err) =>
        console.error("Error updating volume chart:", err)
      );
      currentVolumeCount = volumeData.length;
    }
    // Set tooltip options based on news mode.
    let tooltipOptions = newsMode
      ? {
          custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            let candleTime = new Date(w.globals.seriesX[seriesIndex][dataPointIndex]);
            let timeRange = 3600000;
            if (w.globals.seriesX[seriesIndex].length >= 2 && dataPointIndex > 0) {
              let prevTime = new Date(w.globals.seriesX[seriesIndex][dataPointIndex - 1]).getTime();
              let currTime = candleTime.getTime();
              timeRange = currTime - prevTime;
            }
            let relatedNews = fetchedNews
              ? fetchedNews.filter((news) => {
                  let newsTime = news.pubDate * 1000;
                  return (
                    newsTime >= candleTime.getTime() &&
                    newsTime < candleTime.getTime() + timeRange
                  );
                })
              : [];
            if (relatedNews.length > 0) {
              return `<div class="p-2"><strong>${relatedNews[0].title}</strong></div>`;
            }
            return `<div class="p-2">No news available</div>`;
          },
        }
      : { shared: true, intersect: false, custom: undefined };

    let newOptions = {
      chart: {
        animations: { enabled: true },
        toolbar: { autoSelected: "zoom" },
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
                let candleIndex = config.dataPointIndex;
                if (candleIndex >= 0 && data && data[candleIndex]) {
                  let candleTime = new Date(data[candleIndex].datetime);
                  let timeRange = 3600000;
                  if (data.length >= 2 && candleIndex > 0) {
                    let prevTime = new Date(data[candleIndex - 1].datetime).getTime();
                    let currTime = candleTime.getTime();
                    timeRange = currTime - prevTime;
                  }
                  let relatedNews = fetchedNews
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
                let globals = chartContext.w.globals;
                let offsetY = event.offsetY;
                let gridHeight = globals.gridHeight;
                if (!gridHeight) return;
                let minY = globals.minY;
                let maxY = globals.maxY;
                let gridSpacing = 5;
                let extraPoints = gridSpacing + 2;
                let price =
                  Math.round((maxY - (offsetY / gridHeight) * (maxY - minY)) * 100) / 100 + extraPoints;
                let alertOn = alertDrawingMode ? true : false;
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
        max: newXMax ? newXMax : currentXMax,
      },
      yaxis: {
        tooltip: { enabled: true },
        opposite: true,
        min: currentYMin,
        max: currentYMax,
      },
      annotations: {
        yaxis: getAnnotations(data),
      },
      tooltip: tooltipOptions,
    };
    chart.updateOptions(newOptions).catch((err) =>
      console.error("Error updating chart options:", err)
    );

    // Update trend, MACD, and current price info.
    let lastCandle = data[data.length - 1];
    let macdSignal = lastCandle.MACD_signal == lastCandle.MACD;
    if (macdSignal) {
      macdlastsignal = lastCandle.MACD_signal;
    } else if (macdlastsignal === 0) {
      if (document.getElementById("macd-recommendation")) {
        document.getElementById("macd-recommendation").innerText = "Waiting ...";
      }
    } else if (macdlastsignal > lastCandle.MACD_signal) {
      if (document.getElementById("macd-recommendation")) {
        document.getElementById("macd-recommendation").innerText = "BUY";
      }
    } else {
      if (document.getElementById("macd-recommendation")) {
        document.getElementById("macd-recommendation").innerText = "SELL";
      }
    }
    let currentPrice = lastCandle.close;
    let currentPriceColor =
      lastCandle.close > lastCandle.open ? bullishColor : bearishColor;
    if (document.getElementById("trend-recommendation")) {
      document.getElementById("trend-recommendation").innerText =
        lastCandle.TREND_RECOMMENDATION || "N/A";
    }
    if (document.getElementById("trend-strength")) {
      document.getElementById("trend-strength").innerText =
        lastCandle.TREND_STRENGTH !== undefined
          ? lastCandle.TREND_STRENGTH
          : "N/A";
    }
    if (document.getElementById("current-price")) {
      document.getElementById("current-price").innerHTML = `<span style="color:${currentPriceColor}; font-weight:bold;">${currentPrice.toFixed(2)}</span>`;
    }
  } catch (err) {
    console.error("Error in updateChart function:", err);
  }
}

// Options for candlestick chart.
let chartOptions = {
  chart: {
    type: "candlestick",
    height: 600,
    animations: { enabled: true },
    zoom: { enabled: true, type: "xy" },
    id: "candlestick-chart",
    toolbar: { autoSelected: "zoom" },
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
            let candleIndex = config.dataPointIndex;
            if (candleIndex >= 0) {
              let candleTime = new Date(chartContext.w.globals.seriesX[0][candleIndex]);
              let timeRange = 3600000;
              if (chartContext.w.globals.seriesX[0].length >= 2 && candleIndex > 0) {
                let prevTime = new Date(chartContext.w.globals.seriesX[0][candleIndex - 1]).getTime();
                let currTime = candleTime.getTime();
                timeRange = currTime - prevTime;
              }
              let relatedNews = fetchedNews
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
            console.error("Error in news mode chart click event:", err);
          }
          return;
        }
        if (drawingMode || alertDrawingMode) {
          try {
            let globals = chartContext.w.globals;
            let offsetY = event.offsetY;
            let gridHeight = globals.gridHeight;
            if (!gridHeight) return;
            let minY = globals.minY;
            let maxY = globals.maxY;
            let gridSpacing = 5;
            let extraPoints = gridSpacing + 2;
            let price =
              Math.round((maxY - (offsetY / gridHeight) * (maxY - minY)) * 100) / 100 + extraPoints;
            let alertOn = alertDrawingMode ? true : false;
            drawnLines.push({ price, alertOn, alertTriggered: false });
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
  tooltip: { shared: true, intersect: false, custom: undefined },
};

// Options for volume chart.
let volumeOptions = {
  chart: {
    type: "bar",
    selection: {
      enabled: true,
      xaxis: {
        min: new Date('20 Jan 2017').getTime(),
        max: new Date('10 Dec 2017').getTime()
      }
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

// Wait for DOM ready.
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

    // Set up control buttons.
    const drawLineBtn = document.getElementById("draw-line-button");
    if (drawLineBtn) {
      drawLineBtn.addEventListener("click", function () {
        try {
          drawingMode = !drawingMode;
          this.classList.toggle("bg-blue-600", drawingMode);
          this.classList.toggle("bg-gray-400", !drawingMode);
        } catch (err) {
          console.error("Error in draw-line-button click handler:", err);
        }
      });
    } else {
      console.warn("draw-line-button not found.");
    }
    const toggleAlertBtn = document.getElementById("toggle-alert-button");
    if (toggleAlertBtn) {
      toggleAlertBtn.addEventListener("click", function () {
        try {
          alertDrawingMode = !alertDrawingMode;
          this.classList.toggle("bg-blue-600", alertDrawingMode);
          this.classList.toggle("bg-gray-400", !alertDrawingMode);
        } catch (err) {
          console.error("Error in toggle-alert-button click handler:", err);
        }
      });
    } else {
      console.warn("toggle-alert-button not found.");
    }
    const removeLineBtn = document.getElementById("remove-line-button");
    if (removeLineBtn) {
      removeLineBtn.addEventListener("click", function () {
        try {
          if (drawnLines.length === 0) {
            alert("No drawn lines to remove.");
            return;
          }
          let listStr = drawnLines
            .map((line, index) => `${index + 1}: Price = ${line.price.toFixed(2)}`)
            .join("<br>");
          document.getElementById("modal-lines").innerHTML = listStr;
          document.getElementById("removal-modal").classList.remove("hidden");
        } catch (err) {
          console.error("Error in remove-line-button click handler:", err);
        }
      });
    } else {
      console.warn("remove-line-button not found.");
    }
    const cancelRemoveBtn = document.getElementById("cancel-remove");
    if (cancelRemoveBtn) {
      cancelRemoveBtn.addEventListener("click", function () {
        document.getElementById("removal-modal").classList.add("hidden");
      });
    }
    const confirmRemoveBtn = document.getElementById("confirm-remove");
    if (confirmRemoveBtn) {
      confirmRemoveBtn.addEventListener("click", function () {
        try {
          let input = document.getElementById("remove-input").value;
          if (input) {
            let numbers = input
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
    const updateBtn = document.getElementById("updateBtn");
    if (updateBtn) {
      updateBtn.addEventListener("click", function () {
        try {
          currentXMin = null;
          currentXMax = null;
          currentYMin = null;
          currentYMax = null;
          updateChart();
        } catch (err) {
          console.error("Error in updateBtn click handler:", err);
        }
      });
    }
    const marketSelect = document.getElementById("marketSelect");
    if (marketSelect) {
      marketSelect.addEventListener("change", function (e) {
        try {
          const selectedId = parseInt(e.target.value);
          currentMarketId = selectedId;
          const market = activeMarkets.find((m) => m.id === selectedId);
          updateMarketInfo(market);
          updateChart();
        } catch (err) {
          console.error("Error in marketSelect change handler:", err);
        }
      });
    }
    // Set up news mode toggle button.
    const newsModeBtn = document.getElementById("news-mode-button");
    if (newsModeBtn) {
      newsModeBtn.addEventListener("click", function () {
        try {
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
                    let prevTime = new Date(
                      w.globals.seriesX[seriesIndex][dataPointIndex - 1]
                    ).getTime();
                    let currTime = candleTime.getTime();
                    timeRange = currTime - prevTime;
                  }
                  let relatedNews = fetchedNews
                    ? fetchedNews.filter((news) => {
                        let newsTime = news.pubDate * 1000;
                        return (
                          newsTime >= candleTime.getTime() &&
                          newsTime < candleTime.getTime() + timeRange
                        );
                      })
                    : [];
                  if (relatedNews.length > 0) {
                    return `<div class="p-2"><strong>${relatedNews[0].title}</strong></div>`;
                  }
                  return `<div class="p-2">No news available</div>`;
                },
              },
            });
          } else {
            // Clear the custom tooltip function when exiting news mode.
            chart.updateOptions({
              tooltip: { shared: true, intersect: false, custom: undefined },
              toolbar: { autoSelected: "zoom" },
            });
          }
        } catch (err) {
          console.error("Error toggling news mode:", err);
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





function getDate(limit, timeframe) {
  // Get the current date/time
  const now = new Date();

  // Parse the numeric part and the unit from the timeframe string
  const value = parseInt(timeframe.slice(0, -1), 10);
  if (isNaN(value)) {
    throw new Error("Invalid timeframe: missing numeric part.");
  }
  const unit = timeframe.slice(-1).toLowerCase();

  // Determine the multiplier in milliseconds based on the unit
  let multiplier;
  switch (unit) {
    case 'm': // minutes
      multiplier = 60 * 1000; // 60000 ms in a minute
      break;
    case 'h': // hours
      multiplier = 60 * 60 * 1000; // 3600000 ms in an hour
      break;
    case 'd': // days
      multiplier = 24 * 60 * 60 * 1000; // 86400000 ms in a day
      break;
    default:
      throw new Error("Unsupported timeframe unit. Use 'm' for minutes, 'h' for hours, or 'd' for days.");
  }

  // Calculate the total milliseconds to subtract
  const totalMilliseconds = limit * value * multiplier;
  const targetTime = new Date(now.getTime() - totalMilliseconds);

  // Format the resulting date as "YYYY-MM-DD HH:MM:SS"
  const year = targetTime.getFullYear();
  const month = String(targetTime.getMonth() + 1).padStart(2, '0');
  const day = String(targetTime.getDate()).padStart(2, '0');
  const hours = String(targetTime.getHours()).padStart(2, '0');
  const minutes = String(targetTime.getMinutes()).padStart(2, '0');
  const seconds = String(targetTime.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Example usage:
// If current time is 2025-02-12 23:56:50,
// getDate(50, '1m') will subtract 50 minutes.
console.log(getDate(60, "1m"));