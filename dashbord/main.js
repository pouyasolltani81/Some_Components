// let params = new URLSearchParams(window.location.search);
let id = 1;
console.log(id); // Outputs: "Foo Bar"

// Array to store historical prices (we'll store up to 20 points)
const priceHistory = [];
const maxDataPoints = 20;

// Setup Chart.js chart for price line chart
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
    const token = "23b30428c4102a9280abbbd75762cf01";
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

const token2 = "23b30428c4102a9280abbbd75762cf01";
let activeMarkets = [];
let currentMarketId = null;
let candleChart = null;
    
// Fetch active markets from the API
async function fetchActiveMarkets() {
  try {
    const response = await axios.get("http://188.34.202.221:8000/Pair/ListPairs/" , {
      headers: {
        'Accept': "application/json",
        'Authorization': token2,
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
        'Authorization': token2,
      },
    });
        
    if (response.data.return) {
      const ohlcv = response.data.ohlcv;
      // Transform OHLCV data for the Chart.js Financial plugin candlestick chart
      let candleData = ohlcv.map(item => ({
        x: new Date(item.timestamp),
        o: item.open,
        h: item.high,
        l: item.low,
        c: item.close
      }));
          
      updateCandleChart(candleData);
    }
  } catch (error) {
    console.error("Error fetching OHLCV data:", error);
  }
}
    
// Update candlestick chart using Chart.js Financial plugin
function updateCandleChart(data) {
    // If a previous chart exists, destroy it
    if (candleChart) {
        candleChart.destroy();
    }
    const ctx2 = document.getElementById('candle-chart').getContext('2d');
    candleChart = new Chart(ctx2, {
       type: 'candlestick',
       data: {
           datasets: [{
               label: 'OHLCV',
               data: data,
               borderColor: 'rgba(80, 80, 80, 1)',
               borderWidth: 1
           }]
       },
       options: {
           responsive: true,
           scales: {
              x: {
                  type: 'time',
                  time: {
                      tooltipFormat: 'll HH:mm'
                  },
                  ticks: {
                      source: 'auto'
                  }
              },
              y: {
                  position: 'right'
              }
           }
       }
    });
}
    
// Register financial components if needed (Chart.js financial plugin)
if (Chart.FinancialController && Chart.CandlestickElement) {
  Chart.register(Chart.FinancialController, Chart.CandlestickElement);
}
    
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
