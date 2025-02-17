
let params = new URLSearchParams(window.location.search);
let id = params.get("id");
console.log(id); // Outputs: "Foo Bar"

// Array to store historical prices (we'll store up to 20 points)
const priceHistory = [];
const maxDataPoints = 20;

// Setup Chart.js chart
const ctx = document.getElementById('priceChart').getContext('2d');
const priceChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [], // Timestamps will be added here
    datasets: [{
      label: 'Price',
      data: [],
      backgroundColor: 'rgba(16, 185, 129, 0.2)', // green-500
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 2,
      tension: 0.3,
      fill: true
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'second' },
        title: { display: true, text: 'Time' }
      },
      y: {
        title: { display: true, text: 'Price ($)' }
      }
    }
  }
});

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

          // Update chart labels and data arrays
          priceChart.data.labels = priceHistory.map(point => point.time);
          priceChart.data.datasets[0].data = priceHistory.map(point => point.price);
          priceChart.update();
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


      console.log(ohlcv, time_interval_for_chart);


      // const ohlcv = response.data.ohlcv;

      // Transform OHLCV data for the candlestick chart plugin
      let candleData = ohlcv.map(item => ({
        x: new Date(item.timestamp),
        o: item.open,
        h: item.high,
        l: item.low,
        c: item.close
      }));
      // candleData.push({
      //   x: new Date(),
      //   o: 97000,
      //   h: 97000,
      //   l: 97000,
      //   c: 97000
      // })

      updateCandleChart(ohlcv);
    }
  } catch (error) {
    console.error("Error fetching OHLCV data:", error);
  }
}
setInterval(fetchOHLCVData, time_interval_for_chart);


// Register financial components if needed (ensure these exist in Chart.js Financial plugin)
if (Chart.FinancialController && Chart.CandlestickElement) {
  Chart.register(Chart.FinancialController, Chart.CandlestickElement);
}
// Global variables.
let drawnLines = [];  // Array of { price, alertOn, alertTriggered }
let drawingMode = false;
// We'll use separate transforms for x (time) and y (price)
let currentXTransform = d3.zoomIdentity;
let currentYTransform = d3.zoomIdentity;

function updateCandleChart(data) {
  // Remove any existing tooltip.
  d3.selectAll(".tooltip").remove();

  // Read user settings.
  const showSMA = document.getElementById("show-sma").checked;
  const showEMA = document.getElementById("show-ema").checked;
  const showFib = document.getElementById("show-fib").checked;
  const showSupportResistance = document.getElementById("show-support-resistance").checked;
  const bullishColor = document.getElementById("bullish-color").value || "green";
  const bearishColor = document.getElementById("bearish-color").value || "red";
  const additionalIndicators = Array.from(document.getElementById("additional-indicators").selectedOptions)
    .map(opt => opt.value);

  // Configuration.
  const width = 1200,
    height = 600,
    margin = { top: 30, right: 60, bottom: 50, left: 60 },
    chartWidth = width - margin.left - margin.right,
    chartHeight = height - margin.top - margin.bottom;

  // Extend the x-domain for white space on the right.
  const xMin = d3.min(data, d => new Date(d.datetime));
  const xMax = d3.max(data, d => new Date(d.datetime));
  const extraPadding = (xMax - xMin) * 0.1; // 10% extra
  const xDomain = [xMin, new Date(xMax.getTime() + extraPadding)];

  // Clear previous chart.
  d3.select("#candle-chart").html("");

  // Create SVG.
  const svg = d3.select("#candle-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  // Define clipPath.
  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

  // Main group translated by margins.
  const mainGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create x-axis group at the bottom.
  const xAxisGroup = mainGroup.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${chartHeight})`);

  // Create nested groups to support independent x and y transforms.
  const xGroup = mainGroup.append("g")
    .attr("class", "xGroup")
    .attr("transform", `translate(${currentXTransform.x},0) scale(${currentXTransform.k},1)`);
  const chartGroup = xGroup.append("g")
    .attr("class", "chartGroup")
    .attr("clip-path", "url(#clip)")
    .attr("transform", `translate(0, ${currentYTransform.y}) scale(1, ${currentYTransform.k})`);

  // Scales.
  const xScale = d3.scaleTime()
    .domain(xDomain)
    .range([0, chartWidth]);
  const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.low), d3.max(data, d => d.high)])
    .nice()
    .range([chartHeight, 0]);

  // Create x-axis.
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat("%a %H:%M"))
    .tickSizeOuter(0);
  xAxisGroup.call(xAxis.scale(currentXTransform.rescaleX(xScale)));


  

  // Create y-axis on the right.
  const yAxis = d3.axisRight(yScale)
    .tickSize(-chartWidth)
    .tickFormat(d3.format("$,.2f"));
  mainGroup.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${chartWidth},0)`)
    .call(yAxis.scale(currentYTransform.rescaleY(yScale)))
    .call(g => g.select(".domain").remove()); // Remove extra top line.
  mainGroup.selectAll(".y-axis .tick line")
    .attr("stroke", "#ccc")
    .attr("stroke-opacity", 0.3);


    

  // Draw candles.
  const candleWidth = chartWidth / data.length * 0.7;
  const candles = chartGroup.selectAll(".candle")
    .data(data)
    .join("g")
    .attr("class", "candle")
    .attr("transform", d => `translate(${xScale(new Date(d.datetime))},0)`);
  candles.append("rect")
    .attr("x", -candleWidth / 2)
    .attr("width", candleWidth)
    .attr("fill", d => d.close > d.open ? bullishColor : bearishColor)
    .attr("y", d => yScale(Math.max(d.open, d.close)))
    .attr("height", d => Math.abs(yScale(d.open) - yScale(d.close)));
  candles.append("line")
    .attr("class", "wick")
    .attr("stroke", d => d.close > d.open ? bullishColor : bearishColor)
    .attr("y1", d => yScale(d.high))
    .attr("y2", d => yScale(d.low))
    .attr("x1", 0)
    .attr("x2", 0);

  // Get last candle for trend info.
  const lastCandle = data[data.length - 1];
  const currentPrice = lastCandle.close;
  const currentPriceColor = lastCandle.close > lastCandle.open ? bullishColor : bearishColor;

  // Draw support/resistance lines (if enabled) with labels on the right.
  if (showSupportResistance) {
    const srLevels = [
      { label: "S1", value: lastCandle.S1 },
      { label: "S2", value: lastCandle.S2 },
      { label: "S3", value: lastCandle.S3 },
      { label: "R1", value: lastCandle.R1 },
      { label: "R2", value: lastCandle.R2 },
      { label: "R3", value: lastCandle.R3 }
    ];
    srLevels.forEach(level => {
      if (level.value != null) {
        chartGroup.append("line")
          .attr("x1", 0)
          .attr("x2", chartWidth)
          .attr("y1", yScale(level.value))
          .attr("y2", yScale(level.value))
          .attr("stroke", "rgba(255, 0, 0, 0.3)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4");
        mainGroup.append("text")
          .attr("x",  (-10))
          .attr("y", yScale(level.value) + 4)
          .attr("fill", "rgba(255, 0, 0, 0.5)")
          .attr("font-size", "12px")
          .text(level.label);
      }
    });
  }

  // Draw current price dotted line.
  chartGroup.append("line")
    .attr("x1", 0)
    .attr("x2", chartWidth)
    .attr("y1", yScale(currentPrice))
    .attr("y2", yScale(currentPrice))
    .attr("stroke", currentPriceColor)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5");

  // Conditionally draw SMA_20.
  if (showSMA) {
    const smaData = data.filter(d => d.SMA_20 != null)
      .map(d => ({ datetime: new Date(d.datetime), value: d.SMA_20 }));
    if (smaData.length) {
      const smaLine = d3.line()
        .x(d => currentXTransform.rescaleX(xScale)(d.datetime))
        .y(d => currentYTransform.rescaleY(yScale)(d.value));
      chartGroup.append("path")
        .datum(smaData)
        .attr("class", "sma-line")
        .attr("d", smaLine)
        .attr("stroke", "#FF9800")
        .attr("fill", "none")
        .attr("stroke-width", 1.5);
    }
  }

  // Conditionally draw EMA_20.
  if (showEMA) {
    const emaData = data.filter(d => d.EMA_20 != null)
      .map(d => ({ datetime: new Date(d.datetime), value: d.EMA_20 }));
    if (emaData.length) {
      const emaLine = d3.line()
        .x(d => currentXTransform.rescaleX(xScale)(d.datetime))
        .y(d => currentYTransform.rescaleY(yScale)(d.value));
      chartGroup.append("path")
        .datum(emaData)
        .attr("class", "ema-line")
        .attr("d", emaLine)
        .attr("stroke", "blue")
        .attr("fill", "none")
        .attr("stroke-width", 1.5);
    }
  }

  // Conditionally draw Fibonacci lines.
  if (showFib) {
    const fibLevels = [
      { label: "FIB_S3", value: lastCandle.FIB_S3 },
      { label: "FIB_S2", value: lastCandle.FIB_S2 },
      { label: "FIB_S1", value: lastCandle.FIB_S1 },
      { label: "FIB_PP", value: lastCandle.FIB_PP },
      { label: "FIB_R1", value: lastCandle.FIB_R1 },
      { label: "FIB_R2", value: lastCandle.FIB_R2 },
      { label: "FIB_R3", value: lastCandle.FIB_R3 }
    ];
    fibLevels.forEach(level => {
      if (level.value != null) {
        chartGroup.append("line")
          .attr("x1", 0)
          .attr("x2", chartWidth)
          .attr("y1", yScale(level.value))
          .attr("y2", yScale(level.value))
          .attr("stroke", "lightblue")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4");
        chartGroup.append("text")
          .attr("x", (-10))
          .attr("y", yScale(level.value) - 5)
          .attr("fill", "lightblue")
          .attr("font-size", "12px")
          .text(level.label);
      }
    });
  }

  // Draw additional indicators.
  additionalIndicators.forEach(indicatorName => {
    const indData = data.filter(d => d[indicatorName] != null)
      .map(d => ({ datetime: new Date(d.datetime), value: d[indicatorName] }));
    if (indData.length) {
      const indLine = d3.line()
        .x(d => currentXTransform.rescaleX(xScale)(d.datetime))
        .y(d => currentYTransform.rescaleY(yScale)(d.value));
      chartGroup.append("path")
        .datum(indData)
        .attr("class", `indicator-line ${indicatorName}`)
        .attr("d", indLine)
        .attr("stroke", "purple")
        .attr("fill", "none")
        .attr("stroke-width", 1.5);
    }
  });

  // Re-draw user-drawn lines (data join).
  const drawnLineSelection = chartGroup.selectAll(".drawn-line-group")
    .data(drawnLines, (d, i) => i);
  const drawnLineEnter = drawnLineSelection.enter()
    .append("g")
    .attr("class", "drawn-line-group");
  drawnLineEnter.append("line")
    .attr("x1", 0)
    .attr("x2", chartWidth)
    .attr("y1", d => yScale(d.price))
    .attr("y2", d => yScale(d.price))
    .attr("stroke", d => d.alertOn ? "orange" : "gray")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4");
  drawnLineEnter.append("text")
    .attr("x", chartWidth - 40)
    .attr("y", d => yScale(d.price) - 5)
    .attr("fill", d => d.alertOn ? "orange" : "gray")
    .attr("font-size", "12px")
    .text((d, i) => `Line ${i + 1}`);

  // Check drawn lines for alert conditions.
  drawnLines.forEach(line => {
    if (line.alertOn && !line.alertTriggered && Math.abs(currentPrice - line.price) < (currentPrice * 0.001)) {
      alert(`Price reached drawn line at ${line.price.toFixed(2)}, price :${currentPrice * 0.001} , bobo : ${Math.abs(currentPrice - line.price)} condition : ${Math.abs(currentPrice - line.price) < (currentPrice * 0.001)}` );
      line.alertTriggered = true;
    }
  });

  // Crosshair for drawing mode.
  const crosshair = chartGroup.append("g")
    .attr("class", "crosshair")
    .style("display", "none");
  crosshair.append("line")
    .attr("id", "crosshairX")
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3");
  crosshair.append("line")
    .attr("id", "crosshairY")
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3");
  crosshair.append("text")
    .attr("id", "crosshairInfo")
    .attr("x", 10)
    .attr("y", 10)
    .attr("fill", "black")
    .attr("font-size", "12px");

  // Overlay for tooltip, drawing, and crosshair.
  const chartOverlay = chartGroup.append("rect")
    .attr("class", "overlay")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .style("fill", "none")
    .style("pointer-events", "all")
    .style("cursor", drawingMode ? "crosshair" : "default")
    .on("mousemove", function (event) {
      // Get pointer coordinates relative to xGroup and chartGroup.
      const pointerX = d3.pointer(event, xGroup.node())[0];
      const pointerY = d3.pointer(event, chartGroup.node())[1];
      // Use the current transforms to invert the scales.
      const timeVal = currentXTransform.rescaleX(xScale).invert(pointerX);
      const priceVal = currentYTransform.rescaleY(yScale).invert(pointerY);
      d3.select(".tooltip")
        .style("opacity", 1)
        .html(`
        <div>Time: ${dateFns.format(timeVal, 'MMM d HH:mm')}</div>
        <div>Price: ${priceVal.toFixed(2)}</div>
      `)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
      // Show crosshair in drawing mode.
      if (drawingMode) {
        crosshair.style("display", null);
        crosshair.select("#crosshairX")
          .attr("x1", pointerX)
          .attr("x2", pointerX)
          .attr("y1", 0)
          .attr("y2", chartHeight);
        crosshair.select("#crosshairY")
          .attr("x1", 0)
          .attr("x2", chartWidth)
          .attr("y1", pointerY)
          .attr("y2", pointerY);
        crosshair.select("#crosshairInfo")
          .attr("x", pointerX + 5)
          .attr("y", pointerY - 5)
          .text(`${dateFns.format(timeVal, 'MMM d HH:mm')} | ${priceVal.toFixed(2)}`);
      } else {
        crosshair.style("display", "none");
      }
    })
    .on("mouseout", function () {
      d3.select(".tooltip").style("opacity", 0);
      crosshair.style("display", "none");
    })
    // In drawing mode, clicking adds a new line.
    .on("click", function (event) {
      if (drawingMode) {
        const pointerY = d3.pointer(event, chartGroup.node())[1];
        const price = currentYTransform.rescaleY(yScale).invert(pointerY);
        const alertOn = confirm("Enable alert for this line? Click OK for yes, Cancel for no.");
        drawnLines.push({ price: price, alertOn: alertOn, alertTriggered: false });
        fetchOHLCVData();
      }
    });

  // Zoom behavior for x-axis on the bottom overlay.
  const zoomX = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [chartWidth, chartHeight]])
    .extent([[0, 0], [chartWidth, chartHeight]])
    .on("zoom", function (event) {
      currentXTransform = event.transform;
      xGroup.attr("transform", `translate(${currentXTransform.x},0) scale(${currentXTransform.k},1)`);
      xAxisGroup.call(xAxis.scale(currentXTransform.rescaleX(xScale)));
    });
  mainGroup.append("rect")
    .attr("x", 0)
    .attr("y", chartHeight)
    .attr("width", chartWidth)
    .attr("height", margin.bottom)
    .style("fill", "transparent")
    .style("cursor", "ew-resize")
    .call(zoomX)
    .call(zoomX.transform, currentXTransform);

  // Zoom behavior for y-axis on the right margin.
  const zoomY = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [chartWidth, chartHeight]])
    .extent([[0, 0], [chartWidth, chartHeight]])
    .on("zoom", function (event) {
      currentYTransform = event.transform;
      chartGroup.attr("transform", `translate(0, ${currentYTransform.y}) scale(1, ${currentYTransform.k})`);
      mainGroup.select(".y-axis").call(yAxis.scale(currentYTransform.rescaleY(yScale)));
    });
  mainGroup.append("rect")
    .attr("x", chartWidth)
    .attr("y", 0)
    .attr("width", margin.right)
    .attr("height", chartHeight)
    .style("fill", "transparent")
    .style("cursor", "ns-resize")
    .call(zoomY)
    .call(zoomY.transform, currentYTransform);

  // Update trend and current price info.
  document.getElementById("trend-recommendation").innerText = lastCandle.TREND_RECOMMENDATION || "N/A";
  document.getElementById("trend-strength").innerText = (lastCandle.TREND_STRENGTH !== undefined ? lastCandle.TREND_STRENGTH : "N/A");
  document.getElementById("current-price").innerHTML = `<span style="color: ${currentPriceColor}; font-weight: bold;">${currentPrice.toFixed(2)}</span>`;
}

// Toggle drawing mode.
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
    fetchOHLCVData();
  }
});






// Event listeners for the Update button and market selection
document.getElementById('updateBtn').addEventListener('click', fetchOHLCVData);
document.getElementById('marketSelect').addEventListener('change', function (e) {
  const selectedId = parseInt(e.target.value);
  currentMarketId = selectedId;
  const market = activeMarkets.find(m => m.id === selectedId);
  updateMarketInfo(market);
  fetchOHLCVData();
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