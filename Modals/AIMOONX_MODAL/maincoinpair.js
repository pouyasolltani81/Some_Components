
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
        const response = await axios.get("http://188.34.202.221:8000/Pair/ListPairs/" , {
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
        }
        select.appendChild(option);
      });
      // Set default market
      if (activeMarkets.length > 0) {
        currentMarketId = activeMarkets[0].id;
        updateMarketInfo(activeMarkets[0]);
      }
    }
    
    // Update the market info display
    function updateMarketInfo(market) {
      document.getElementById('marketName').textContent = market.name;
      document.getElementById('marketDesc').textContent = market.desc || "";
    }
    
    // Fetch OHLCV data using provided parameters and update candlestick chart
    async function fetchOHLCVData() {
      const marketpair_id = currentMarketId;
      const timeframe = document.getElementById('timeframe').value;
      const since = document.getElementById('since').value;
      const limit = document.getElementById('limit').value;
      
      try {
        const response = await axios.post("http://188.34.202.221:8000/Market/exGetOHLCV/", {
          marketpair_id,
          timeframe,
          since,
          limit
        } , {
          headers: {
            'Accept': "application/json",
            'Authorization': token,
          },
        });
        
        if (response.data.return) {
          const ohlcv = response.data.ohlcv;
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
          
          updateCandleChart(candleData);
        }
      } catch (error) {
        console.error("Error fetching OHLCV data:", error);
      }
    }
    
// Register financial components if needed (ensure these exist in Chart.js Financial plugin)
if (Chart.FinancialController && Chart.CandlestickElement) {
  Chart.register(Chart.FinancialController, Chart.CandlestickElement);
}


function updateCandleChart(data) {

    // Configuration
    const width = 1200;
    const height = 600;
    const margin = { top: 30, right: 40, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous chart
    d3.select("#candle-chart").html("");

    // Create SVG
    const svg = d3.select("#candle-chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.x))
        .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.l), d3.max(data, d => d.h)])
        .nice()
        .range([chartHeight, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat("%a %H:%M"))
        .tickSizeOuter(0);

    const yAxis = d3.axisRight(yScale)
        .tickSize(chartWidth)
        .tickFormat(d3.format("$,.2f"));

    // Add Y-axis grid
    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .select(".domain").remove()
        .selectAll(".tick line")
        .attr("stroke", "var(--grid-line)")
        .attr("stroke-opacity", 0.3);

    // Add X-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle");

    // Draw candles
    const candleWidth = chartWidth / data.length * 0.7;
    
    const candles = svg.append("g")
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("class", "candle")
        .attr("transform", d => `translate(${xScale(d.x)},0)`);

    // Candle bodies
    candles.append("rect")
        .attr("x", -candleWidth/2)
        .attr("width", candleWidth)
        .attr("fill", d => d.c > d.o ? "var(--bullish)" : "var(--bearish)")
        .attr("y", d => yScale(Math.max(d.o, d.c)))
        .attr("height", d => Math.abs(yScale(d.o) - yScale(d.c)));

    // Wicks
    candles.append("line")
        .attr("class", "wick")
        .attr("stroke", d => d.c > d.o ? "var(--bullish)" : "var(--bearish)")
        .attr("y1", d => yScale(d.h))
        .attr("y2", d => yScale(d.l))
        .attr("x1", 0)
        .attr("x2", 0);

    // Volume bars (optional)
    // Technical indicators (SMA example)
    // const smaPeriod = 20;
    // const sma = data.map((d, i) => {
    //     if (i < smaPeriod - 1) return null;
    //     const sum = data.slice(i - smaPeriod + 1, i + 1)
    //                    .reduce((acc, val) => acc + val.c, 0);
    //     return { x: d.x, value: sum / smaPeriod };
    // }).filter(d => d !== null);

    // // Draw SMA line
    // const smaLine = d3.line()
    //     .x(d => xScale(d.x))
    //     .y(d => yScale(d.value));

    // svg.append("path")
    //     .datum(sma)
    //     .attr("class", "sma-line")
    //     .attr("d", smaLine)
    //     .attr("stroke", "#FF9800")
    //     .attr("fill", "none")
    //     .attr("stroke-width", 1.5);

    // Crosshair and tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", (event) => {
            const [xCoord] = d3.pointer(event);
            const bisectDate = d3.bisector(d => d.x).left;
            const x0 = xScale.invert(xCoord);
            const i = bisectDate(data, x0, 1);
            const d = data[i];
            
            tooltip.style("opacity", 1)
                .html(`
                    <div>Time: ${dateFns.format(d.x, 'MMM d HH:mm')}</div>
                    <div>Open: ${d.o.toFixed(2)}</div>
                    <div>High: ${d.h.toFixed(2)}</div>
                    <div>Low: ${d.l.toFixed(2)}</div>
                    <div>Close: ${d.c.toFixed(2)}</div>
                `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
};


    // Event listeners for the Update button and market selection
    document.getElementById('updateBtn').addEventListener('click', fetchOHLCVData);
    document.getElementById('marketSelect').addEventListener('change', function(e) {
      const selectedId = parseInt(e.target.value);
      currentMarketId = selectedId;
      const market = activeMarkets.find(m => m.id === selectedId);
      updateMarketInfo(market);
      fetchOHLCVData();
    });
    
    // Initial calls
    fetchActiveMarkets();
    // Optionally auto-update OHLCV data every 10 seconds
    // setInterval(fetchOHLCVData, 10000);