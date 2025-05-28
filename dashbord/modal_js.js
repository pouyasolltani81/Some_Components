import { coinAnalyze, getLLMResponse, ListPairs } from './endpoints'


// ===========================================================================
// 1. Fetch the list of coin pairs from the API
// ===========================================================================
async function fetchCoinList() {
  const url = ListPairs;
  const token = "23b30428c4102a9280abbbd75762cf01";
  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        Authorization: token,
      },
    });
    console.log("Coin list response:", response);

    return response.data.pairs;
  } catch (error) {
    console.error("Error fetching coin list:", error);
    return [];
  }
}

// ===========================================================================
// 2. Define the SmartCoinAnalysCard class (with integrated coin list)
// ===========================================================================
class SmartCoinAnalysCard {
  constructor(COIN_ONE, COIN_TWO, coinList = null) {
    this.coin_one = COIN_ONE;
    this.coin_two = COIN_TWO;
    this.analysisdata = null ;

    // If a coin list is provided from the API, use it to populate the options;
    // otherwise, use fallback hard-coded pairs.
    if (coinList && coinList.length > 0) {
      // Here we transform the API "name" (e.g. "BTC-USDT") into "BTC/USDT"
      this.Pair_coins_value = coinList.map(pair =>
        pair.name.replace("-", "-")
      );
      // You can customize the display (for example, add emojis) as desired:
      this.Pair_coins_name = coinList.map(pair =>
        pair.name.replace("-", "/")
      );

      this.Pair_coins_ids = coinList.map(pair =>
        pair.id
      );
    } else {
      this.Pair_coins_value = ["XRP/USDT", "BTC/USDT"];
      this.Pair_coins_name = ["🪙 XRP/USDT", "⚡ BTC/USDT"];
    }

    this.prefixId = `card_${Math.random().toString(36).substr(2, 9)}`;
    this.cardElement = null;
    this.triggerButton = null;
    this.newsItems = this.generateMockNews();
    this.newsLinks = null ;
    this.visibleNewsCount = 5;
    this.createTriggerButton();
    this.createModal();
    this.addEventListeners();
  }

  createTriggerButton() {
    const button = document.createElement("button");
    button.className =
      "py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg";
    button.textContent = `${this.coin_one} / ${this.coin_two}`;
    this.triggerButton = button;
  }

  createModal() {
    const cardHTML = `
        <!-- Modal Backdrop & Container -->
<div id="${this.prefixId}" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <!-- Modal -->
  <div class="w-full max-w-5xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
    
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-300">
      <h2 class="text-lg font-semibold text-gray-900">📊 تحلیل کوین</h2>
      <button aria-label="بستن" class="close-button hover:bg-gray-200 p-1.5 rounded-full transition">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Input Form -->
    <div class="p-6 space-y-5" id="${this.prefixId}_InputForm">
      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700">💱 جفت ارز:</label>
        <select id="${this.prefixId}_coinPair" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">⏱️ تایم فریم:</label>
          <select id="${this.prefixId}_timeFrame" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="1m">1Min</option>
            <option value="5m">5Min</option>
            <option value="15m">15Min</option>
            <option value="30m">30Min</option>
            <option value="1h">1H</option>
            <option value="2h">2H</option>
            <option value="4h" selected>4H</option>
            <option value="1d">1D</option>
            <option value="1w">1W</option>
          </select>
        </div>
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">🕒 تعداد کندل:</label>
          <input type="number" id="${this.prefixId}_candleCount" value="10" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
      </div>

      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700">📰 استفاده از اخبار:</label>
        <select id="${this.prefixId}_useNews" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="true" selected>✅ بله</option>
          <option value="false">❌ خیر</option>
        </select>
      </div>

      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700">📊 استفاده از اندیکاتورها:</label>
        <select id="${this.prefixId}_useIndicator" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="true">✅ بله</option>
          <option value="false" selected>❌ خیر</option>
        </select>
      </div>

      <button class="analysis-button w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        تحلیل 🔍
      </button>
    </div>

    <!-- Waiting Message -->
    <div class="waiting-message hidden p-6 bg-blue-50 text-blue-700 animate-slide-up">
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>در حال دریافت داده‌ها... لطفا منتظر بمانید. ⏳</span>
      </div>
    </div>

    <!-- Analysis Answer -->
    <div class="analysis-answer hidden p-6 space-y-4 animate-slide-up">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900" id="${this.prefixId}_pairName">XRP/USDT</h3>
        <span id="${this.prefixId}_decision" class="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">تصمیم</span>
      </div>

      <div class="text-sm text-gray-800 space-y-1">
        <div class="flex justify-between">
          <span>📐 الگو:</span><span id="${this.prefixId}_pattern">-</span>
        </div>
        <div class="flex justify-between">
          <span>⌛ مدت:</span><span id="${this.prefixId}_duration">-</span>
        </div>
        <div class="flex justify-between">
          <span>📅 آخرین بروزرسانی:</span><span id="${this.prefixId}_updatedAt">-</span>
        </div>
        <div>
          <span class="block font-medium">✨ آنالیز:</span>
          <p id="${this.prefixId}_analyse" class="mt-1">-</p>
        </div>
        <div>
          <span class="block font-medium">📝 خلاصه اخبار:</span>
          <p id="${this.prefixId}_summery" class="mt-1">-</p>
        </div>
      </div>

      <div>
        <label class="block mb-1 font-medium text-gray-700">📰 اخبار مرتبط:</label>
        <div class="news-container p-2 rounded-md bg-gray-100" dir="ltr">
          <div id="${this.prefixId}_newsList" class="space-y-2"></div>
        </div>
        <button id="${this.prefixId}_showMoreNews" class="hidden w-full text-sm text-blue-600 hover:underline mt-2">
          نمایش بیشتر
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <button class="refresh-button w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">تجزیه و تحلیل مجدد 🔄</button>
        <button class="more-info-button w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800">اطلاعات بیشتر</button>
      </div>
    </div>

  </div>
</div>

          `;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = cardHTML;

    // Populate the coin pair <select> options using the coinList data
    const coinPairSelect = tempDiv.querySelector(`#${this.prefixId}_coinPair`);
    this.Pair_coins_name.forEach((element, index) => {

      let option = document.createElement("option");
      option.value = this.Pair_coins_value[index];
      option.id = this.Pair_coins_ids[index]
      option.innerHTML = element;
      // Set the default selected option if it matches the card’s coin pair
      if (this.Pair_coins_value[index] === `${this.coin_one}-${this.coin_two}`) {
        option.selected = "true";
      }
      coinPairSelect.appendChild(option);
    });

    this.cardElement = tempDiv.firstElementChild;
  }

  generateMockNews() {
    return Array.from({ length: 20 }, (_, i) => ({
      title: `خبر مرتبط ${i + 1}`,
      link: `https://example.com/news/${i + 1}`,
    }));
  }

  renderNews() {
    console.log(this.newsItems);

    const newsList = this.cardElement.querySelector(
      `#${this.prefixId}_newsList`
    );
    const showMoreButton = this.cardElement.querySelector(
      `#${this.prefixId}_showMoreNews`
    );
    newsList.innerHTML = "";
    this.newsItems.slice(0, this.visibleNewsCount).forEach((news , index) => {
      const newsItem = document.createElement("a");
      // newsItem.href = news.link;
      newsItem.href = this.newsLinks[index];

      newsItem.target = "_blank";
      newsItem.className =
        "block text-purple-600 hover:text-purple-700 transition-colors";
      // newsItem.textContent = news.title;
      newsItem.textContent = news;

      newsList.appendChild(newsItem);
    });
    showMoreButton.classList.toggle(
      "hidden",
      this.newsItems.length <= this.visibleNewsCount
    );
  }

  // ------------------------------------------------------------------------
  // This method demonstrates two axios calls:
  //  1. Sending the analysis request (POST)
  //  2. Retrieving the analysis result (GET)
  // Replace the URLs with your actual endpoints.
  // ------------------------------------------------------------------------
  async fetchData(params) {
    const sendUrl = coinAnalyze;
    const getUrl = getLLMResponse;
    try {
      // 1. Send the analysis request
      const sendResponse = await axios.post(sendUrl, params, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          Authorization: 'e19ad04e557b1cc1fee6b60b4d421fef',
        },
      });

      console.log(sendResponse.data, params);

      // Assume the response returns an analysis ID
      const analysisId = sendResponse.data.data;
      await new Promise((resolve) => setTimeout(resolve, 5000));

      let my_json


      while (true) {

        const params = {
          task_id: `${analysisId}`, // Ensure analysisId is a string
        }

        // qwefetchCoinList(`${analysisId}`)

        // 2. Retrieve the analysis result using the analysisId
        const getResponse = await axios.post(getUrl, params, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
            Authorization: 'e19ad04e557b1cc1fee6b60b4d421fef',
          },

        });

        console.log(getResponse.data);
        console.log(analysisId);

        if (getResponse.data.message == 'completed') {
          console.log('not pending?');
          console.log(getResponse.data.message);
          console.log(getResponse.data.data[0].result);

          this.newsItems = getResponse.data.data[0].result.newsTitles;
          this.newsLinks = getResponse.data.data[0].result.newsLinks;



          my_json = {

            pair: getResponse.data.data[0].name,
            decision: getResponse.data.data[0].result.response.rec_position,
            pattern: getResponse.data.data[0].result.response.chart_Pattern,
            duration: `${getResponse.data.data[0].result.response.duration}`,
            // updatedAt: moment.unix(getResponse.data.data[0].result.response.timestamp *).format("YYYY/MM/DD HH:mm:ss"),
            updatedAt: getResponse.data.data[0].result.response.updatedAt ,

            news_titles: getResponse.data.data[0].result.newsTitles,
            news_links: getResponse.data.data[0].result.newsLinks,

            analyse: getResponse.data.data[0].result.response.analysis,
            summery: getResponse.data.data[0].result.response.summaryFa,



          }

          break;

        }

        console.log("Still pending, retrying in 2 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 2000));


      }

      return my_json;
    } catch (error) {
      console.error("Error fetching analysis data", error);
      // For template purposes, return mocked data if an error occurs
      // return {
      //   pair: params.coinPair,
      //   decision: "خرید 🟢",
      //   pattern: "چکش صعودی 🛠️",
      //   duration: `${params.candleCount} کندل`,
      //   updatedAt: new Date().toLocaleTimeString("fa-IR"),
      // };
    }
  }

  addEventListeners() {
    // Refresh button to restart the analysis process
    const refreshButton = this.cardElement.querySelector(".refresh-button");
    refreshButton.addEventListener("click", () => {
      this.cardElement
        .querySelector(".analysis-answer")
        .classList.add("hidden");
      this.cardElement
        .querySelector(`#${this.prefixId}_InputForm`)
        .classList.remove("hidden");
      this.visibleNewsCount = 5;
      this.cardElement.querySelector(
        `#${this.prefixId}_newsList`
      ).innerHTML = "";
    });

    this.triggerButton.addEventListener("click", () => {
      this.cardElement.classList.remove("hidden");
      // this.triggerButton.classList.add("hidden");
    });

    const analysisButton =
      this.cardElement.querySelector(".analysis-button");
    const showMoreNewsButton = this.cardElement.querySelector(
      `#${this.prefixId}_showMoreNews`
    );
    const moreInfoButton =
      this.cardElement.querySelector(".more-info-button");

    analysisButton.addEventListener("click", async () => {
      analysisButton.disabled = true;
      analysisButton.classList.replace("bg-purple-600", "bg-gray-400");
      analysisButton.classList.replace("hover:bg-purple-700", "cursor-not-allowed");
      this.triggerButton.classList.replace("bg-purple-600", "bg-gray-400");
      analysisButton.classList.replace("bg-teal-600", "bg-gray-400");
      analysisButton.classList.replace("hover:bg-teal-700", "cursor-not-allowed");
      this.triggerButton.classList.replace("bg-teal-600", "bg-gray-400");

      const params = {
        symbol: this.cardElement.querySelector(
          `#${this.prefixId}_coinPair`
        ).value,
        timeframe: this.cardElement.querySelector(
          `#${this.prefixId}_timeFrame`
        ).value,
        candleCount: this.cardElement.querySelector(
          `#${this.prefixId}_candleCount`
        ).value,
        useNews: this.cardElement.querySelector(
          `#${this.prefixId}_useNews`
        ).value,
        useIndicator: this.cardElement.querySelector(
          `#${this.prefixId}_useIndicator`
        ).value,
        useMarketData: true,
        language: "en",
      };

      this.cardElement
        .querySelector(`#${this.prefixId}_InputForm`)
        .classList.add("hidden");
      this.cardElement
        .querySelector(".waiting-message")
        .classList.remove("hidden");

      try {


        const data = await this.fetchData(params);
        this.analysisdata =data ;
        const timestamp = data.updatedAt;
        console.log(data);

        console.log(timestamp);
        
        const date = new Date(timestamp * 1000); // multipl
        console.log(date);

        const formatted = date.toISOString().slice(0, 10); // "2025-05-30"
        console.log(formatted);


        this.cardElement.querySelector(
          `#${this.prefixId}_pairName`
        ).textContent = data.pair;
        this.cardElement.querySelector(
          `#${this.prefixId}_decision`
        ).textContent = data.decision;
        this.cardElement.querySelector(
          `#${this.prefixId}_pattern`
        ).textContent = data.pattern;
        this.cardElement.querySelector(
          `#${this.prefixId}_duration`
        ).textContent = data.duration;
        this.cardElement.querySelector(
          `#${this.prefixId}_updatedAt`
        ).textContent = formatted;

        this.cardElement.querySelector(
          `#${this.prefixId}_analyse`
        ).textContent = data.analyse;

        this.cardElement.querySelector(
          `#${this.prefixId}_summery`
        ).textContent = data.summery;
        this.renderNews();
      } finally {
        analysisButton.disabled = false;
        analysisButton.classList.replace("bg-gray-400", "bg-teal-600");
        analysisButton.classList.replace("cursor-not-allowed", "hover:bg-teal-700");
        this.triggerButton.classList.replace("bg-gray-400", "bg-teal-600");

        this.cardElement
          .querySelector(".waiting-message")
          .classList.add("hidden");
        this.cardElement
          .querySelector(".analysis-answer")
          .classList.remove("hidden");
      }
    });

    showMoreNewsButton.addEventListener("click", () => {
      this.visibleNewsCount += 5;
      this.renderNews();
    });

    moreInfoButton.addEventListener("click", () => {
      let id = this.cardElement.querySelector(
        `#${this.prefixId}_coinPair`
      ).options[document.querySelector(`#${this.prefixId}_coinPair`).selectedIndex].id

      let url = "./MainCoinPair.html?" + new URLSearchParams({ id: id }).toString();
      // location.href = url;
    
      localStorage.setItem('newsAnalysis' , JSON.stringify(this.analysisdata))
      window.open(url, '_blank');

    });

    this.cardElement
      .querySelector(".close-button")
      .addEventListener("click", () => {
        this.cardElement.classList.add("hidden");
        // this.triggerButton.classList.remove("hidden");
      });
  }

  start(container = document.body) {
    container.appendChild(this.triggerButton);
    container.appendChild(this.cardElement);
  }
}

// Helper function to instantiate a new SmartCoinAnalysCard.
// Note: We now pass the fetched coinList as the third parameter.
function showSmartCoinAnalysCard(COIN_ONE, COIN_TWO, coinList, container = document.body) {
  return new SmartCoinAnalysCard(COIN_ONE, COIN_TWO, coinList).start(container);
}

// ===========================================================================
// 3. When the DOM is ready, fetch the coin list and create the cards
// ===========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  const coinList = await fetchCoinList();
  showSmartCoinAnalysCard("BTC", "USDT", coinList, document.getElementById("modal-container"));
  showSmartCoinAnalysCard("ETH", "USDT", coinList, document.getElementById("modal-container2"));
  showSmartCoinAnalysCard("BNB", "USDT", coinList, document.getElementById("modal-container3"));
  showSmartCoinAnalysCard("ETC", "USDT", coinList, document.getElementById("modal-container4"));
  showSmartCoinAnalysCard("USDT", "RLS", coinList, document.getElementById("modal-container5"));
  showSmartCoinAnalysCard("XRP", "USDT", coinList, document.getElementById("modal-container6"));
  showSmartCoinAnalysCard("ADA", "USDT", coinList, document.getElementById("modal-container7"));
  showSmartCoinAnalysCard("IOTA", "USDT", coinList, document.getElementById("modal-container8"));
  showSmartCoinAnalysCard("STX", "USDT", coinList, document.getElementById("modal-container9"));
  showSmartCoinAnalysCard("SUI", "USDT", coinList, document.getElementById("modal-container10"));


});


