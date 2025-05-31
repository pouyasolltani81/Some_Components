// Lightweight-Charts integration for your dashboard
// npm install lightweight-charts
import { createChart } from 'lightweight-charts';

// Chart instance and series references
let chart, candleSeries, volumeSeries;
let srLines = [];
let newsData = [];
let lastCandleTime = null;

export function initLightweightChart(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) throw new Error('Chart container not found');

  // Destroy previous chart if exists
  if (chart) {
    chart.remove();
  }

  chart = createChart(container, {
    width: options.width || container.offsetWidth,
    height: options.height || 500,
    layout: { background: { color: '#fff' }, textColor: '#222' },
    grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
    timeScale: { timeVisible: true, secondsVisible: false, rightOffset: 10 },
    crosshair: { mode: 1 },
    ...options.chartOptions,
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
    wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    ...options.candleOptions,
  });

  volumeSeries = chart.addHistogramSeries({
    color: '#b0bec5', priceFormat: { type: 'volume' },
    priceScaleId: '',
    scaleMargins: { top: 0.8, bottom: 0 },
    ...options.volumeOptions,
  });

  // Custom tooltip for news
  chart.subscribeCrosshairMove(param => {
    if (!param.time || !param.seriesPrices) return;
    const price = param.seriesPrices.get(candleSeries);
    if (!price) return;
    // Find news for this candle
    const news = newsData.filter(n => n.time === param.time);
    if (news.length > 0) {
      // Show your custom tooltip (implement as needed)
      showNewsTooltip(param.point.x, param.point.y, news);
    } else {
      hideNewsTooltip();
    }
  });

  // Hide tooltip on mouse leave
  container.addEventListener('mouseleave', hideNewsTooltip);

  return chart;
}

// Set all candles (full update)
export function setCandles(candles) {
  if (!candleSeries) return;
  candleSeries.setData(candles);
  lastCandleTime = candles.length ? candles[candles.length - 1].time : null;
}

// Append a new candle
export function appendCandle(candle) {
  if (!candleSeries) return;
  candleSeries.update(candle);
  lastCandleTime = candle.time;
}

// Update the last candle (replace)
export function updateLastCandle(candle) {
  if (!candleSeries) return;
  candleSeries.update(candle);
  lastCandleTime = candle.time;
}

// Set volume data
export function setVolumes(volumes) {
  if (!volumeSeries) return;
  volumeSeries.setData(volumes);
}

// Overlays: Support/Resistance lines
export function setSRLines(lines) {
  // Remove previous lines
  srLines.forEach(line => chart.removePriceLine(line));
  srLines = [];
  if (!chart || !candleSeries) return;
  lines.forEach(lvl => {
    const line = candleSeries.createPriceLine({
      price: lvl.price,
      color: lvl.type === 'resistance' ? 'red' : 'green',
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: lvl.label || lvl.type,
    });
    srLines.push(line);
  });
}

// Set news data for tooltips
export function setNews(newsArray) {
  newsData = newsArray || [];
}

// --- Tooltip helpers (implement your own UI as needed) ---
function showNewsTooltip(x, y, newsArr) {
  let tooltip = document.getElementById('news-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'news-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.background = 'rgba(255,255,255,0.97)';
    tooltip.style.border = '1px solid #aaa';
    tooltip.style.borderRadius = '6px';
    tooltip.style.padding = '8px';
    tooltip.style.zIndex = 1000;
    tooltip.style.fontSize = '12px';
    document.body.appendChild(tooltip);
  }
  tooltip.innerHTML = newsArr.map(n => `<b>${n.title}</b><br>${n.body || ''}`).join('<hr>');
  tooltip.style.left = (x + 20) + 'px';
  tooltip.style.top = (y + 20) + 'px';
  tooltip.style.display = 'block';
}
function hideNewsTooltip() {
  const tooltip = document.getElementById('news-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

// --- Example candle format ---
// {
//   time: 1688160000, // unix timestamp (seconds)
//   open: 100, high: 110, low: 95, close: 105
// }
// --- Example volume format ---
// {
//   time: 1688160000, value: 1234, color: '#26a69a' // or '#ef5350'
// }
// --- Example SR line format ---
// { price: 120, type: 'resistance', label: 'R1' }
// --- Example news format ---
// { time: 1688160000, title: 'Big News', body: 'Details...' } 