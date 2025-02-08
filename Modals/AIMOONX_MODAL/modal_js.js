// class SmartCoinAnalysCard {
//     constructor(COIN_ONE, COIN_TWO) {
//         this.smartOrderId = COIN_ONE;
//         this.prefixId = `card_${Math.random().toString(36).substr(2, 9)}`;
//         this.cardElement = null;
//         this.polling = false; // To track polling state
//         this.createCard();
//         this.addEventListeners();
//     }

//     createCard() {
//         const cardHTML = `
//         <div id="${this.prefixId}" class="w-[700px] bg-violet-100 rounded-xl p-6 border-4" dir="ltr">
//             <div class="p-4 flex justify-between">
//                 <div class="hover:text-red-800 cursor-pointer close-button">X</div>
//                 <div>Coin Analysis</div>
//                 <div></div>
//             </div>
//             <div class="flex flex-col gap-2 transition-all" id="${this.prefixId}_InputForm">
//                 <div class="p-4 flex justify-between">
//                     <label class="text-gray-600 pr-2">Coin Pair:</label>
//                     <select id="${this.prefixId}_coinPair" class="border rounded p-2">
//                         <option value="XRP/USDT" selected>XRP/USDT</option>
//                         <option value="BTC/USDT">BTC/USDT</option>
//                         <option value="ETH/USDT">ETH/USDT</option>
//                         <option value="LTC/USDT">LTC/USDT</option>
//                     </select>
//                 </div>
//                 <div class="p-4 flex justify-between">
//                     <div class="flex">
//                         <label class="text-gray-600 pr-2">Time Frame:</label>
//                         <input type="text" id="${this.prefixId}_timeFrame" value="4H" class="border rounded p-1 w-16">
//                     </div>
//                     <div class="flex">
//                         <label class="text-gray-600 pr-2">Candle Count:</label>
//                         <input type="number" id="${this.prefixId}_candleCount" value="10" class="border rounded p-1 w-16">
//                     </div>
//                 </div>
//                 <div class="flex p-4 justify-between">
//                     <div class="flex">
//                         <label class="text-gray-600 pr-2">Use News:</label>
//                         <select id="${this.prefixId}_useNews" class="border rounded p-1">
//                             <option value="true" selected>True</option>
//                             <option value="false">False</option>
//                         </select>
//                     </div>
//                     <div class="flex">
//                         <label class="text-gray-600 pr-2">Use Market Data:</label>
//                         <select id="${this.prefixId}_useMarketData" class="border rounded p-1">
//                             <option value="true" selected>True</option>
//                             <option value="false">False</option>
//                         </select>
//                     </div>
//                     <div class="flex">
//                         <label class="text-gray-600 pr-2">Use Indicator:</label>
//                         <select id="${this.prefixId}_useIndicator" class="border rounded p-1">
//                             <option value="false" selected>False</option>
//                             <option value="true">True</option>
//                         </select>
//                     </div>
//                 </div>
//                 <div class="w-full p-4 text-center bg-yellow-200 rounded-xl border-1 border-gray-800 hover:bg-yellow-300 cursor-pointer analysis-button">
//                     Analyse
//                 </div>
//             </div>
//             <div class="w-full p-4 text-center bg-yellow-200 rounded-xl scale-y-0 transition hidden waiting-message">
//                 Fetching data... Please wait.
//             </div>
//             <div class="flex flex-col transition-all scale-y-0 hidden analysis-answer">
//                 <div class="flex justify-between p-4">
//                     <div>
//                         <div id="${this.prefixId}_pair">XRP/USDT</div>
//                         <div id="${this.prefixId}_pairName">XRP/USDT</div>
//                     </div>
//                     <div class="p-4 bg-green-100 rounded-xl" id="${this.prefixId}_decision">Decision</div>
//                 </div>
//                 <div class="flex justify-between p-4">
//                     <div class="flex">
//                         <label class="text-gray-600 pr-2">Pattern:</label>
//                         <div id="${this.prefixId}_pattern">-</div>
//                     </div>
//                     <div class="flex">
//                         <label class="text-gray-600 pr-2">Duration:</label>
//                         <div id="${this.prefixId}_duration">-</div>
//                     </div>
//                     <div class="flex">
//                         <label class="text-gray-600 pr-2">Updated at:</label>
//                         <div id="${this.prefixId}_updatedAt">-</div>
//                     </div>
//                 </div>
//                 <div class="flex flex-col p-4">
//                     <label class="text-gray-600">Analysis:</label>
//                     <div class="break-words" id="${this.prefixId}_analysisText">-</div>
//                 </div>
//             </div>
//         </div>`;

//         const tempDiv = document.createElement('div');
//         tempDiv.innerHTML = cardHTML;
//         this.cardElement = tempDiv.firstElementChild;
//     }

//     async fetchData(params) {
//         const analyzeUrl = "http://79.175.177.113:15800/AimoonxNewsHUB/LLM/coinAnalyze/";
//         const responseUrl = "http://79.175.177.113:15800/AimoonxNewsHUB/LLM/getLLMResponse/";

//         try {
//             const analyzeResponse = await fetch(analyzeUrl, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(params),
//             });

//             if (!analyzeResponse.ok) {
//                 throw new Error(`Analysis request failed: ${analyzeResponse.status}`);
//             }

//             const analyzeData = await analyzeResponse.json();
//             const taskId = analyzeData.data;
            
//             let statusCompleted = false;
//             let result;

//             while (!statusCompleted) {
//                 const response = await fetch(responseUrl, {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                     },
//                     body: JSON.stringify({ task_id: taskId }),
//                 });

//                 if (!response.ok) {
//                     throw new Error(`Task status request failed: ${response.status}`);
//                 }

//                 const responseData = await response.json();

//                 if (responseData.message === "completed") {
//                     statusCompleted = true;
//                     result = responseData.data[0]; // Extract the first analysis result
//                 } else {
//                     await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
//                 }
//             }

//             return result;
//         } catch (error) {
//             console.error("Error during coin analysis:", error);
//             throw error;
//         }
//     }

//     addEventListeners() {
//         const inputForm = this.cardElement.querySelector(`#${this.prefixId}_InputForm`);
//         const waitingMessage = this.cardElement.querySelector('.waiting-message');
//         const analysisAnswer = this.cardElement.querySelector('.analysis-answer');
//         const analysisButton = this.cardElement.querySelector('.analysis-button');
//         const closeButton = this.cardElement.querySelector('.close-button');

//         analysisButton.addEventListener('click', async () => {
//             const coinPair = this.cardElement.querySelector(`#${this.prefixId}_coinPair`).value;
//             const timeFrame = this.cardElement.querySelector(`#${this.prefixId}_timeFrame`).value;
//             const candleCount = this.cardElement.querySelector(`#${this.prefixId}_candleCount`).value;
//             const useNews = this.cardElement.querySelector(`#${this.prefixId}_useNews`).value;
//             const useMarketData = this.cardElement.querySelector(`#${this.prefixId}_useMarketData`).value;
//             const useIndicator = this.cardElement.querySelector(`#${this.prefixId}_useIndicator`).value;

//             // Show waiting message
//             inputForm.classList.add('scale-y-0');
//             setTimeout(() => {
//                 inputForm.classList.add('hidden');
//                 waitingMessage.classList.remove('hidden');
//                 waitingMessage.classList.remove('scale-y-0');
//             }, 300);

//             this.polling = true; // Start polling state

//             try {
//                 const data = await this.fetchData({
//                     symbol: coinPair,
//                     timeframe: timeFrame,
//                     candleCount: candleCount,
//                     useNews: useNews === "true",
//                     useMarketData: useMarketData === "true",
//                     useIndicator: useIndicator === "true",
//                 });

//                 // Stop polling and hide waiting message
//                 this.polling = false;
//                 waitingMessage.classList.add('scale-y-0');
//                 setTimeout(() => {
//                     waitingMessage.classList.add('hidden');
//                     analysisAnswer.classList.remove('hidden');
//                     analysisAnswer.classList.remove('scale-y-0');

//                     // Update analysis answer
//                     this.cardElement.querySelector(`#${this.prefixId}_pair`).textContent = data.pair || 'N/A';
//                     this.cardElement.querySelector(`#${this.prefixId}_decision`).textContent = data.rec_position || 'N/A';
//                     this.cardElement.querySelector(`#${this.prefixId}_pattern`).textContent = data.chart_Pattern || 'N/A';
//                     this.cardElement.querySelector(`#${this.prefixId}_duration`).textContent = data.timeframe || 'N/A';
//                     this.cardElement.querySelector(`#${this.prefixId}_updatedAt`).textContent = new Date().toLocaleString();
//                     this.cardElement.querySelector(`#${this.prefixId}_analysisText`).textContent = data.summaryFa || 'No data available.';
//                 }, 300);
//             } catch (error) {
//                 console.error('Error fetching data:', error);
//                 this.polling = false;
//             }
//         });

//         closeButton.addEventListener('click', () => {
//             this.polling = false; // Stop polling if the card is closed
//             this.cardElement.remove();
//         });
//     }

//     start(container = document.body) {
//         container.appendChild(this.cardElement);
//     }

//     stop() {
//         this.polling = false; // Ensure polling stops when this method is called
//     }
// }

// function showSmartCoinAnalysCard(COIN_ONE, COIN_TWO, container = document.body) {
//     const card = new SmartCoinAnalysCard(COIN_ONE, COIN_TWO);
//     card.start(container);
//     return card;
// }


// const card = showSmartCoinAnalysCard('BTC', 'USD', document.body);

class SmartCoinAnalysCard {
    constructor(COIN_ONE, COIN_TWO) {
      this.coin_one = COIN_ONE;
      this.coin_two = COIN_TWO;
      this.Pair_coins_value = ['XRP/USDT' , 'BTC/USDT']
      this.Pair_coins_name = ['🪙 XRP/USDT' , '⚡ BTC/USDT']

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
      const button = document.createElement('button');
      button.className = 'py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg';
      button.textContent = `${this.coin_one} / ${this.coin_two}`;
      this.triggerButton = button;
    }
    
    createModal() {

     
      

      const cardHTML = `
        <div id="${this.prefixId}" class="w-[600px] bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in hidden">
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
              
              <select id="${this.prefixId}_coinPair" value='${this.coin_one}/${this.coin_two}' class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-gray-700">⏱️ تایم فریم:</label>
                <select id="${this.prefixId}_timeFrame" class="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="1H">1H</option>
                  <option value="4H" selected>4H</option>
                  <option value="1D">1D</option>
                  <option value="1W">1W</option>
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
                <option value="true" selected>✅ بله</option>
                <option value="false">❌ خیر</option>
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
            </div>

            <div class="space-y-2">
              <label class="text-gray-700">📰 اخبار مرتبط:</label>
              <div class="news-container bg-gray-50 p-2 rounded-lg">
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

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cardHTML;

      // Loop through the coin pairs and add them as options
      this.Pair_coins_name.forEach((element, index) => {
        let option = document.createElement('option');
        option.value = this.Pair_coins_value[index];
        option.innerHTML = element;

        // Check if the current option matches the selected coin pair
        if (this.Pair_coins_value[index] === `${this.coin_one}/${this.coin_two}`) {
          option.selected = 'true'; // Set the selected attribute
        }

        // Append the option to the select element
        tempDiv.querySelector(`#${this.prefixId}_coinPair`).appendChild(option);
      });

      // Append the tempDiv content to the DOM
      this.cardElement = tempDiv.firstElementChild;

    }

    generateMockNews() {
      return Array.from({ length: 20 }, (_, i) => ({
        title: `خبر مرتبط ${i + 1}`,
        link: `https://example.com/news/${i + 1}`,
      }));
    }

    renderNews() {
      const newsList = this.cardElement.querySelector(`#${this.prefixId}_newsList`);
      const showMoreButton = this.cardElement.querySelector(`#${this.prefixId}_showMoreNews`);

      newsList.innerHTML = '';
      this.newsItems.slice(0, this.visibleNewsCount).forEach((news) => {
        const newsItem = document.createElement('a');
        newsItem.href = news.link;
        newsItem.target = "_blank";
        newsItem.className = "block text-purple-600 hover:text-purple-700 transition-colors";
        newsItem.textContent = news.title;
        newsList.appendChild(newsItem);
      });

      showMoreButton.classList.toggle('hidden', this.newsItems.length <= this.visibleNewsCount);
    }

    async fetchData(params) {
      const mockedData = {
        pair: params.coinPair,
        decision: "خرید 🟢",
        pattern: "چکش صعودی 🛠️",
        duration: `${params.candleCount} کندل`,
        updatedAt: new Date().toLocaleTimeString('fa-IR'),
      };

      return new Promise((resolve) => {
        setTimeout(() => resolve(mockedData), 2000);
      });
    }

    addEventListeners() {

      // Add Refresh Button Handler
      const refreshButton = this.cardElement.querySelector('.refresh-button');
      refreshButton.addEventListener('click', () => {
        // Reset to input form
        this.cardElement.querySelector('.analysis-answer').classList.add('hidden');
        this.cardElement.querySelector(`#${this.prefixId}_InputForm`).classList.remove('hidden');
        
        // Reset visible news count
        this.visibleNewsCount = 5;
        
        // Clear previous results
        this.cardElement.querySelector(`#${this.prefixId}_newsList`).innerHTML = '';
      });
      this.triggerButton.addEventListener('click', () => {
        this.cardElement.classList.remove('hidden');
        this.triggerButton.classList.add('hidden');

      });

      const analysisButton = this.cardElement.querySelector('.analysis-button');
      const showMoreNewsButton = this.cardElement.querySelector(`#${this.prefixId}_showMoreNews`);
      const moreInfoButton = this.cardElement.querySelector('.more-info-button');

      analysisButton.addEventListener('click', async () => {
        analysisButton.disabled = true;
        analysisButton.classList.replace('bg-purple-600', 'bg-gray-400');
        analysisButton.classList.replace('hover:bg-purple-700', 'cursor-not-allowed');
        this.triggerButton.classList.replace('bg-purple-600', 'bg-gray-400');


        const params = {
          coinPair: this.cardElement.querySelector(`#${this.prefixId}_coinPair`).value,
          timeFrame: this.cardElement.querySelector(`#${this.prefixId}_timeFrame`).value,
          candleCount: this.cardElement.querySelector(`#${this.prefixId}_candleCount`).value,
          useNews: this.cardElement.querySelector(`#${this.prefixId}_useNews`).value,
          useIndicator: this.cardElement.querySelector(`#${this.prefixId}_useIndicator`).value
        };

        this.cardElement.querySelector(`#${this.prefixId}_InputForm`).classList.add('hidden');
        this.cardElement.querySelector('.waiting-message').classList.remove('hidden');

        try {
          const data = await this.fetchData(params);
          
          this.cardElement.querySelector(`#${this.prefixId}_pairName`).textContent = data.pair;
          this.cardElement.querySelector(`#${this.prefixId}_decision`).textContent = data.decision;
          this.cardElement.querySelector(`#${this.prefixId}_pattern`).textContent = data.pattern;
          this.cardElement.querySelector(`#${this.prefixId}_duration`).textContent = data.duration;
          this.cardElement.querySelector(`#${this.prefixId}_updatedAt`).textContent = data.updatedAt;
          
          this.renderNews();
        } finally {
          analysisButton.disabled = false;
          analysisButton.classList.replace('bg-gray-400', 'bg-purple-600');
          analysisButton.classList.replace('cursor-not-allowed', 'hover:bg-purple-700');
          this.triggerButton.classList.replace('bg-gray-400', 'bg-purple-600');

          this.cardElement.querySelector('.waiting-message').classList.add('hidden');
          this.cardElement.querySelector('.analysis-answer').classList.remove('hidden');
        }
      });

      showMoreNewsButton.addEventListener('click', () => {
        this.visibleNewsCount += 5;
        this.renderNews();
      });

      moreInfoButton.addEventListener('click', () => {
        window.open('https://example.com/more-info', '_blank');
      });

      this.cardElement.querySelector('.close-button').addEventListener('click', () => {
        this.cardElement.classList.add('hidden');
        this.triggerButton.classList.remove('hidden');

      });
    }

    start(container = document.body) {
      container.appendChild(this.triggerButton);
      container.appendChild(this.cardElement);
    }
  }

  function showSmartCoinAnalysCard(COIN_ONE, COIN_TWO, container = document.body) {
    return new SmartCoinAnalysCard(COIN_ONE, COIN_TWO).start(container);
  }

  document.addEventListener('DOMContentLoaded', () => {
    showSmartCoinAnalysCard("XRP", "USDT", document.getElementById('modal-container'));
    showSmartCoinAnalysCard("BTC", "USDT", document.getElementById('modal-container2'));
    showSmartCoinAnalysCard("TRUMP", "USDT", document.getElementById('modal-container3'));


  });




  //////////////// fetch test


//   (function() {
//     var cors_api_host = 'cors-anywhere.herokuapp.com';
//     var cors_api_url = 'https://' + cors_api_host + '/';
//     var slice = [].slice;
//     var origin = window.location.protocol + '//' + window.location.host;
//     var open = XMLHttpRequest.prototype.open;
//     XMLHttpRequest.prototype.open = function() {
//         var args = slice.call(arguments);
//         var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
//         if (targetOrigin && targetOrigin[0].toLowerCase() !== origin &&
//             targetOrigin[1] !== cors_api_host) {
//             args[1] = cors_api_url + args[1];
//         }
//         return open.apply(this, args);
//     };
// })();

//   async function fetchCoinList() {
//     const url = 'http://188.34.202.221:8000/Coin/ListCoins/';
//     const token = '6ae3d79118083127c5442c7c6bfaf0b9'
//     try {
//         const response = await fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
                
//                 'Authorization': token
//             },
           
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log(data);
//     } catch (error) {
//         console.error('Error fetching coin list:', error);
//     }
// }

// fetchCoinList();

// const axios = require('axios'); // Import Axios if you're using Node.js or a bundler

// async function fetchCoinList() {
//     const url = 'http://188.34.202.221:8000/Coin/ListCoins/';
//     const token = '6ae3d79118083127c5442c7c6bfaf0b9'; // Your token

//     try {
//         const response = await axios.get(url, {
//             headers: {
//                 'Accept': 'application/json',
//                 'Authorization': token,
//                 'Content-Type': 'application/json; charset=utf-8'
//             },
//             withCredentials: true, // If you need to send cookies
//             withXSRFToken: true,  // If you're handling CSRF tokens
//         });

//         console.log(response.data); // Log the response data
//     } catch (error) {
//         console.error('Error fetching coin list:', error);
//     }
// }

// fetchCoinList();

async function fetchCoinList() {
  const url = "http://188.34.202.221:8000/Coin/ListCoins/";
  const token = "6ae3d79118083127c5442c7c6bfaf0b9";
  try {
    axios
      .get(url, {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        Authorization: token,
        withCredentials: true,
        // xsrfCookieName: "XSRF-TOKEN", // تغییر این به نام کوکی CSRF شما
        // xsrfHeaderName: "X-XSRF-TOKEN", // تغییر این به نام هدر CSRF شما
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.error("There was an error making the request:", error);
      });
  } catch (error) {
    console.error("Error fetching coin list:", error);
  }
}

fetchCoinList();