// ===========================================================================
// 1. Fetch the list of coin pairs from the API
// ===========================================================================
async function fetchCoinList() {
  const url = "http://188.34.202.221:8000/Pair/ListPairs/";
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
          <div id="${this.prefixId}" class="max-w-[1000px] bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in hidden">
            <div class="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
              <button class="close-button hover:bg-purple-700 p-1 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div class="text-lg font-semibold">📊 تحلیل کوین</div>
            </div>

            <div class="p-6 space-y-4" id="${this.prefixId}_InputForm">
              <div class="space-y-2">
                <label class="text-gray-700">💱 جفت ارز:</label>
                <select id="${this.prefixId}_coinPair" class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-gray-700">⏱️ تایم فریم:</label>
                  <select id="${this.prefixId}_timeFrame" class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
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
                <div class="space-y-2">
                  <label class="text-gray-700">🕒 تعداد کندل:</label>
                  <input type="number" id="${this.prefixId}_candleCount" value="10" class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-gray-700">📰 استفاده از اخبار:</label>
                <select id="${this.prefixId}_useNews" class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="true" selected>✅ بله</option>
                  <option value="false">❌ خیر</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-gray-700">📊 استفاده از اندیکاتورها:</label>
                <select id="${this.prefixId}_useIndicator" class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="true" >✅ بله</option>
                  <option value="false" selected>❌ خیر</option>
                </select>
              </div>

              <button class="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors analysis-button">
                تحلیل ✨
              </button>
            </div>

            <div class="p-6 bg-yellow-100 hidden waiting-message animate-slide-up">
              <div class="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>در حال دریافت داده‌ها... لطفا منتظر بمانید. ⏳</span>
              </div>
            </div>

            <div class="p-6 space-y-4 hidden analysis-answer animate-slide-up">
              <div class="flex justify-between items-center">
                <div class="text-lg font-semibold" id="${this.prefixId}_pairName">XRP/USDT</div>
                <div class="px-4 py-2 bg-green-100 text-green-800 rounded-lg" id="${this.prefixId}_decision">تصمیم</div>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-gray-700">📐 الگو:</span>
                  <span id="${this.prefixId}_pattern">-</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">⌛ مدت:</span>
                  <span id="${this.prefixId}_duration">-</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-700">📅 آخرین بروزرسانی:</span>
                  <span id="${this.prefixId}_updatedAt">-</span>
                </div>

                <div class="flex flex-col justify-between">
                  <span class="text-gray-700">✨ آنالیز:</span>
                  <span id="${this.prefixId}_analyse">-</span>
                </div>

                <div class="flex flex-col justify-between">
                  <span class="text-gray-700">📝 خلاصه اخبار:</span>
                  <span id="${this.prefixId}_summery">-</span>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-gray-700">📰 اخبار مرتبط:</label>
                <div class="news-container bg-gray-50 p-2 rounded-lg" dir='ltr'>
                  <div id="${this.prefixId}_newsList" class="space-y-2"></div>
                </div>
                <button id="${this.prefixId}_showMoreNews" class="w-full py-1 text-purple-600 hover:text-purple-700 transition-colors hidden">
                  نمایش بیشتر
                </button>
              </div>

              <button class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors refresh-button">
                تجزیه و تحلیل مجدد 🔄
              </button>

              <button class="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors more-info-button">
                اطلاعات بیشتر
              </button>
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
    this.newsItems.slice(0, this.visibleNewsCount).forEach((news) => {
      const newsItem = document.createElement("a");
      // newsItem.href = news.link;
      newsItem.href = 'https://example.com/news/';

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
    const sendUrl = "http://79.175.177.113:15800/AimoonxNewsHUB/LLM/coinAnalyze/";
    const getUrl = "http://79.175.177.113:15800/AimoonxNewsHUB/LLM/getLLMResponse/";
    try {
      // 1. Send the analysis request
      const sendResponse = await axios.post(sendUrl, params, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          Authorization: '189b4bf96bf5de782515c1b4f0b2a2c7',
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
            Authorization: '189b4bf96bf5de782515c1b4f0b2a2c7',
          },

        });

        console.log(getResponse.data);
        console.log(analysisId);

        if (getResponse.data.message == 'completed') {
          console.log('not pending?');
          console.log(getResponse.data.message);
          console.log(getResponse.data.data[0].result);

          this.newsItems = getResponse.data.data[0].result.newsTitles;


          my_json = {

            pair: getResponse.data.data[0].name,
            decision: getResponse.data.data[0].result.response.rec_position,
            pattern: getResponse.data.data[0].result.response.chart_Pattern,
            duration: `${getResponse.data.data[0].result.response.duration}`,
            updatedAt: moment.unix(getResponse.data.data[0].result.response.timestamp).format("YYYY/MM/DD HH:mm:ss"), 
            news: getResponse.data.data[0].result.newsTitles,
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
      this.triggerButton.classList.add("hidden");
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
      };

      this.cardElement
        .querySelector(`#${this.prefixId}_InputForm`)
        .classList.add("hidden");
      this.cardElement
        .querySelector(".waiting-message")
        .classList.remove("hidden");

      try {

        const data = await this.fetchData(params);
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
        ).textContent = data.updatedAt;

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
      
      let url = "./MainCoinPair.html?" + new URLSearchParams({ id: id}).toString();
      // location.href = url;
      window.open(url, '_blank');
      
    });

    this.cardElement
      .querySelector(".close-button")
      .addEventListener("click", () => {
        this.cardElement.classList.add("hidden");
        this.triggerButton.classList.remove("hidden");
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
  showSmartCoinAnalysCard("ETH", "USDT", coinList, document.getElementById("modal-container"));
  showSmartCoinAnalysCard("BTC", "USDT", coinList, document.getElementById("modal-container2"));
  showSmartCoinAnalysCard("BNB", "USDT", coinList, document.getElementById("modal-container3"));
  showSmartCoinAnalysCard("ETC", "USDT", coinList, document.getElementById("modal-container4"));

});