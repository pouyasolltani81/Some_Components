import ApexCharts from 'apexcharts'
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
setInterval(fetchCoinList, 2000);









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
        time_interval_for_chart = 5000


      } else {
        ohlcv = response.data.ohlcv;
        time_interval_for_chart = 2000
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

// fetchOHLCVData()
setInterval(updateChart, time_interval_for_chart);



// Global state variables
let chart;
let drawnLines = [];  // Array of { price, alertOn, alertTriggered }
let drawingMode = false;
// To preserve zoom state, store current x and y axis min/max.
let currentXMin = null, currentXMax = null, currentYMin = null, currentYMax = null;
let macdlastsignal = 0;


// Build annotations for drawn lines, support/resistance, and Fibonacci.
function getAnnotations(data) {
  let annotations = [];
  // Add drawn lines.
  drawnLines.forEach((line, index) => {
    annotations.push({
      y: line.price,
      borderColor: line.alertOn ? 'orange' : 'gray',
      label: {
        borderColor: line.alertOn ? 'orange' : 'gray',
        style: { color: '#fff', background: line.alertOn ? 'orange' : 'gray' },
        text: `Line ${index + 1}`
      }
    });
  });
  // Add support/resistance lines from the last candle.
  if (document.getElementById('show-support-resistance').checked && data.length > 0) {
    let lastCandle = data[data.length - 1];
    let sr = [
      { label: 'S1', value: lastCandle.S1 },
      { label: 'S2', value: lastCandle.S2 },
      { label: 'S3', value: lastCandle.S3 },
      { label: 'R1', value: lastCandle.R1 },
      { label: 'R2', value: lastCandle.R2 },
      { label: 'R3', value: lastCandle.R3 }
    ];
    sr.forEach(item => {
      if (item.value != null) {
        annotations.push({
          y: item.value,
          borderColor: 'rgba(255,0,0,0.3)',
          label: {
            borderColor: 'rgba(255,0,0,0.3)',
            style: { color: '#fff', background: 'rgba(255,0,0,0.3)' },
            text: item.label,
            position: 'left'
          }
        });
      }
    });
  }
  // Add Fibonacci lines.
  if (document.getElementById('show-fib').checked && data.length > 0) {
    let lastCandle = data[data.length - 1];
    let fib = [
      { label: 'FIB_S3', value: lastCandle.FIB_S3 },
      { label: 'FIB_S2', value: lastCandle.FIB_S2 },
      { label: 'FIB_S1', value: lastCandle.FIB_S1 },
      { label: 'FIB_PP', value: lastCandle.FIB_PP },
      { label: 'FIB_R1', value: lastCandle.FIB_R1 },
      { label: 'FIB_R2', value: lastCandle.FIB_R2 },
      { label: 'FIB_R3', value: lastCandle.FIB_R3 }
    ];
    fib.forEach(item => {
      if (item.value != null) {
        annotations.push({
          y: item.value,
          borderColor: 'lightblue',
          label: {
            borderColor: 'lightblue',
            style: { color: '#fff', background: 'lightblue' },
            text: item.label,
            position: 'left'

          }
        });
      }
    });
  }
  return annotations;
}

// Update only the annotations (for drawn lines, etc.)
async function updateAnnotations(data) {

  let ann = { yaxis: getAnnotations(data) };
  chart.updateOptions({ annotations: ann });
}

// Main function to update the chart
async function updateChart() {
  let data = await fetchOHLCVData();
  // Prepare candlestick data for ApexCharts.
  let candlestickData = data.map(d => ({
    x: new Date(d.datetime),
    y: [d.open, d.high, d.low, d.close]
  }));
  // Build series array.
  let series = [
    { name: 'Candlestick', type: 'candlestick', data: candlestickData }
  ];

  // if (data[0].SMA_20) {

  // If SMA_20 is toggled, add its series.
  if (document.getElementById('show-sma').checked) {
    let smaData = [];
    for (let i = 19; i < data.length; i++) {
      smaData.push({ x: new Date(data[i].datetime), y: data[i].SMA_20 });
    }
    series.push({ name: 'SMA_20', type: 'line', data: smaData });
  }

  // }



  // if (data[0].EMA_20) {

  // If EMA_20 is toggled, add its series.
  if (document.getElementById('show-ema').checked) {
    let emaData = [];
    for (let i = 0; i < data.length; i++) {
      if (i >= 19) {
        emaData.push({ x: new Date(data[i].datetime), y: data[i].EMA_20 });
      }
    }
    series.push({ name: 'EMA_20', type: 'line', data: emaData });
  }



  // // If MACD is toggled, add its series.
  // if (document.getElementById('show-MACD').checked) {
  //   let MACD = [];
  //   for (let i = 0; i < data.length; i++) {
  //     if (i >= 19) {
  //       MACD.push({ x: new Date(data[i].datetime), y: data[i].MACD });
  //     }
  //   }
  //   series.push({ name: 'MACD', type: 'line', data: MACD });
  // }

  // }

  // (Additional indicators can be added similarly using the multi-select.)

  // Update series.
  chart.updateSeries(series, true);

  // Read color settings.
  let bullishColor = document.getElementById('bullish-color').value;
  let bearishColor = document.getElementById('bearish-color').value;

  // Prepare new options.
  let newOptions = {
    chart: {
      animations: { enabled: false },
      toolbar: { autoSelected: 'zoom' },
      zoom: { enabled: true, type: 'xy' },
      events: {
        // Preserve zoom state.
        zoomed: function (chartContext, { xaxis, yaxis }) {
          currentXMin = xaxis.min;
          currentXMax = xaxis.max;
          currentYMin = yaxis.min;
          currentYMax = yaxis.max;
        },
        // If drawing mode is active, add a drawn line on click.
        click: function (event, chartContext, config) {
          if (drawingMode) {
            let globals = chartContext.w.globals;
            let offsetY = event.offsetY;
            let gridHeight = globals.gridHeight;
            let minY = globals.minY;
            let maxY = globals.maxY;
            // Invert offsetY to compute the price.
            let price = maxY - (offsetY / gridHeight) * (maxY - minY);
            let alertOn = confirm("Enable alert for this line? OK for yes, Cancel for no.");
            drawnLines.push({ price: price, alertOn: alertOn, alertTriggered: false });
            updateAnnotations();
          }
        }
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: bullishColor,
          downward: bearishColor
        }
      }
    },
    xaxis: {
      type: 'datetime',
      // Preserve zoom state if available.
      min: currentXMin,
      max: currentXMax
    },
    yaxis: {
      tooltip: { enabled: true },
      opposite: true,
      min: currentYMin,
      max: currentYMax
    },
    annotations: {
      yaxis: getAnnotations(data)
    },
    tooltip: {
      shared: true,
      intersect: false
    }
  };

  // Update chart options.
  chart.updateOptions(newOptions);

  // Update trend and current price in the control panel using the last candle.
  let lastCandle = data[data.length - 1];
  let macdSignal = data[data.length - 1].MACD_signal == data[data.length - 1].MACD ? true : false;
  console.log(macdSignal , 'because : ' );
  
  console.log('mac signal : ' ,data[data.length - 1].MACD_signal);
  console.log('mac  : ' ,data[data.length - 1].MACD);

  


  if (macdSignal) {
    macdlastsignal = data[data.length - 1].MACD_signal
  } else if(macdlastsignal == 0){

    document.getElementById('macd-recommendation').innerText = 'Waiting ...' || "N/A";


  } else if (macdlastsignal > data[data.length - 1].MACD_signal) {

    document.getElementById('macd-recommendation').innerText = 'BUY' || "N/A";


  } else {

    document.getElementById('macd-recommendation').innerText = 'SELL' || "N/A";

  }

  let currentPrice = lastCandle.close;
  let currentPriceColor = lastCandle.close > lastCandle.open ? bullishColor : bearishColor;
  document.getElementById('trend-recommendation').innerText = lastCandle.TREND_RECOMMENDATION || "N/A";
  document.getElementById('trend-strength').innerText = (lastCandle.TREND_STRENGTH !== undefined ? lastCandle.TREND_STRENGTH : "N/A");
  document.getElementById('current-price').innerHTML = `<span style="color:${currentPriceColor}; font-weight:bold;">${currentPrice.toFixed(2)}</span>`;
}

// Initialize chart options and create the chart.
let chartOptions = {
  chart: {
    type: 'candlestick',
    height: 600,
    animations: { enabled: false },
    zoom: { enabled: true, type: 'xy' },
    toolbar: { autoSelected: 'zoom' },
    events: {
      zoomed: function (chartContext, { xaxis, yaxis }) {
        currentXMin = xaxis.min;
        currentXMax = xaxis.max;
        currentYMin = yaxis.min;
        currentYMax = yaxis.max;
      },
      click: function (event, chartContext, config) {
        if (drawingMode) {
          let globals = chartContext.w.globals;
          let offsetY = event.offsetY;
          let gridHeight = globals.gridHeight;
          let minY = globals.minY;
          let maxY = globals.maxY;
          let price = maxY - (offsetY / gridHeight) * (maxY - minY);
          let alertOn = confirm("Enable alert for this line? OK for yes, Cancel for no.");
          drawnLines.push({ price: price, alertOn: alertOn, alertTriggered: false });
          updateAnnotations();
        }
      }
    }
  },
  series: [],
  xaxis: { type: 'datetime' },
  yaxis: { tooltip: { enabled: true }, opposite: true },
  plotOptions: {
    candlestick: {
      colors: {
        upward: '#008000',
        downward: '#ff0000'
      }
    }
  },
  annotations: { yaxis: [] },
  tooltip: { shared: true, intersect: false }
};

chart = new ApexCharts(document.querySelector("#chart"), chartOptions);
chart.render();


// Toggle drawing mode when "Draw Line" is clicked.
document.getElementById("draw-line-button").addEventListener("click", function () {
  drawingMode = !drawingMode;
  if (drawingMode) {
    alert("Drawing mode enabled. Click on the chart to add a horizontal line.");
  }
  this.classList.toggle("bg-blue-600", drawingMode);
  this.classList.toggle("bg-gray-400", !drawingMode);
});

// Remove lines via a prompt listing drawn lines.
document.getElementById("remove-line-button").addEventListener("click", function () {
  if (drawnLines.length === 0) {
    alert("No drawn lines to remove.");
    return;
  }
  let listStr = drawnLines.map((line, index) => `${index + 1}: Price = ${line.price.toFixed(2)}`).join("\n");
  let input = prompt(`Enter the number(s) of the line(s) to remove, separated by commas:\n${listStr}`);
  if (input) {
    let numbers = input.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    numbers.sort((a, b) => b - a);
    numbers.forEach(n => {
      if (n > 0 && n <= drawnLines.length) {
        drawnLines.splice(n - 1, 1);
      }
    });
    updateAnnotations();
  }
});





// Event listeners for the Update button and market selection
document.getElementById('updateBtn').addEventListener('click', updateChart);
document.getElementById('marketSelect').addEventListener('change', function (e) {
  const selectedId = parseInt(e.target.value);
  currentMarketId = selectedId;
  const market = activeMarkets.find(m => m.id === selectedId);
  updateMarketInfo(market);
  updateChart();
});

// Initial calls
fetchActiveMarkets();
// Optionally auto-update OHLCV data every 10 seconds






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