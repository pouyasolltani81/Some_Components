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
        this.smartOrderId = COIN_ONE;
        this.prefixId = `card_${Math.random().toString(36).substr(2, 9)}`;
        this.cardElement = null;
        this.createCard();
        this.addEventListeners();
    }

    createCard() {
        const cardHTML = `
        <div id="${this.prefixId}" class="w-[1000px] bg-violet-100 rounded-xl p-6 border-4" dir="ltr">
            <div class="p-4 flex justify-between">
                <div class="hover:text-red-800 cursor-pointer close-button">❌</div>
                <div>📊 Coin Analysis</div>
                <div></div>
            </div>
            <div class="flex flex-col gap-2 transition-all" id="${this.prefixId}_InputForm">
                <div class="p-4 flex justify-between">
                    <label class="text-gray-600 pr-2">💱 Coin Pair:</label>
                    <select id="${this.prefixId}_coinPair" class="border rounded-xl w-full p-2">
                        <option value="XRP/USDT" selected>🪙 XRP/USDT</option>
                        <option value="BTC/USDT">⚡ BTC/USDT</option>
                        <option value="ETH/USDT">🔥 ETH/USDT</option>
                        <option value="LTC/USDT">🌟 LTC/USDT</option>
                    </select>
                </div>
                <div class="p-4 flex justify-between">
                    <div class="flex">
                        <label class="text-gray-600 pr-2">⏱️ Time Frame:</label>
                        <input type="text" id="${this.prefixId}_timeFrame" value="4H" class="border rounded p-1 w-16">
                    </div>
                    <div class="flex">
                        <label class="text-gray-600 pr-2">🕒 Candle Count:</label>
                        <input type="number" id="${this.prefixId}_candleCount" value="10" class="border rounded p-1 w-16">
                    </div>
                </div>
                <div class="flex p-4 justify-between">
                    <div class="flex">
                        <label class="text-gray-600 pr-2">📰 Use News:</label>
                        <select id="${this.prefixId}_useNews" class="border rounded p-1">
                            <option value="true" selected>✅ True</option>
                            <option value="false">❌ False</option>
                        </select>
                    </div>
                    <div class="flex">
                        <label class="text-gray-600 pr-2">📈 Use Market Data:</label>
                        <select id="${this.prefixId}_useMarketData" class="border rounded p-1">
                            <option value="true" selected>✅ True</option>
                            <option value="false">❌ False</option>
                        </select>
                    </div>
                    <div class="flex">
                        <label class="text-gray-600 pr-2">📊 Use Indicator:</label>
                        <select id="${this.prefixId}_useIndicator" class="border rounded p-1">
                            <option value="false" selected>❌ False</option>
                            <option value="true">✅ True</option>
                        </select>
                    </div>
                </div>
                <div class="w-full p-4 text-center bg-yellow-200 rounded-xl border-1 border-gray-800 hover:bg-yellow-300 cursor-pointer analysis-button">
                    Analyse ✨
                </div>
            </div>
            <div class="w-full p-4 text-center bg-yellow-200 rounded-xl scale-y-0 transition hidden waiting-message">
                Fetching data... Please wait. ⏳
            </div>
            <div class="flex flex-col transition-all scale-y-0 hidden analysis-answer">
                <div class="flex justify-between p-4">
                    <div>
                        <div id="${this.prefixId}_pairName">XRP/USDT</div>
                    </div>
                    <div class="p-4 bg-green-100 rounded-xl" id="${this.prefixId}_decision">Decision</div>
                </div>
                <div class="flex justify-between p-4">
                    <div class="flex">
                        <label class="text-gray-600 pr-2">📐 Pattern:</label>
                        <div id="${this.prefixId}_pattern">-</div>
                    </div>
                    <div class="flex">
                        <label class="text-gray-600 pr-2">⌛ Duration:</label>
                        <div id="${this.prefixId}_duration">-</div>
                    </div>
                    <div class="flex">
                        <label class="text-gray-600 pr-2">📅 Updated at:</label>
                        <div id="${this.prefixId}_updatedAt">-</div>
                    </div>
                </div>
                <div class="flex flex-col p-4">
                    <label class="text-gray-600">📝 Analysis:</label>
                    <div class="break-words" id="${this.prefixId}_analysisText">-</div>
                </div>
            </div>
        </div>`;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHTML;
        this.cardElement = tempDiv.firstElementChild;
    }

    async fetchData(params) {
        // Mocked analysis data
        const mockedData = {
            pair: params.coinPair,
            decision: "BUY 🟢",
            pattern: "Bullish Hammer 🛠️",
            duration: `${params.candleCount} candles`,
            updatedAt: new Date().toLocaleTimeString(),
            analysisText: `Based on the recent ${params.candleCount} candles in the ${params.timeFrame} timeframe, the market appears to be bullish.`,
        };

        // Simulate a delay for fetching data
        return new Promise((resolve) => {
            setTimeout(() => resolve(mockedData), 2000);
        });
    }

    addEventListeners() {
        const inputForm = this.cardElement.querySelector(`#${this.prefixId}_InputForm`);
        const waitingMessage = this.cardElement.querySelector('.waiting-message');
        const analysisAnswer = this.cardElement.querySelector('.analysis-answer');
        const analysisButton = this.cardElement.querySelector('.analysis-button');
        const closeButton = this.cardElement.querySelector('.close-button');

        analysisButton.addEventListener('click', async () => {
            const coinPair = this.cardElement.querySelector(`#${this.prefixId}_coinPair`).value;
            const timeFrame = this.cardElement.querySelector(`#${this.prefixId}_timeFrame`).value;
            const candleCount = this.cardElement.querySelector(`#${this.prefixId}_candleCount`).value;
            const useNews = this.cardElement.querySelector(`#${this.prefixId}_useNews`).value;
            const useMarketData = this.cardElement.querySelector(`#${this.prefixId}_useMarketData`).value;
            const useIndicator = this.cardElement.querySelector(`#${this.prefixId}_useIndicator`).value;

            // Show waiting message
            inputForm.classList.add('scale-y-0');
            setTimeout(() => {
                inputForm.classList.add('hidden');
                waitingMessage.classList.remove('hidden');
                waitingMessage.classList.remove('scale-y-0');
            }, 300);

            // Fetch mocked data
            try {
                const data = await this.fetchData({
                    coinPair,
                    timeFrame,
                    candleCount,
                    useNews,
                    useMarketData,
                    useIndicator,
                });

                // Hide waiting message and show analysis answer
                waitingMessage.classList.add('scale-y-0');
                setTimeout(() => {
                    waitingMessage.classList.add('hidden');
                    analysisAnswer.classList.remove('hidden');
                    analysisAnswer.classList.remove('scale-y-0');

                    // Update analysis answer
                    this.cardElement.querySelector(`#${this.prefixId}_pair`).textContent = data.pair || 'N/A';
                    this.cardElement.querySelector(`#${this.prefixId}_decision`).textContent = data.decision || 'N/A';
                    this.cardElement.querySelector(`#${this.prefixId}_pattern`).textContent = data.pattern || 'N/A';
                    this.cardElement.querySelector(`#${this.prefixId}_duration`).textContent = data.duration || 'N/A';
                    this.cardElement.querySelector(`#${this.prefixId}_updatedAt`).textContent = data.updatedAt || 'N/A';
                    this.cardElement.querySelector(`#${this.prefixId}_analysisText`).textContent = data.analysisText || 'No data available.';
                }, 300);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        });

        closeButton.addEventListener('click', () => {
            this.cardElement.remove();
        });
    }

    start(container = document.body) {
        container.appendChild(this.cardElement);
    }

    stop() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

function showSmartCoinAnalysCard(COIN_ONE, COIN_TWO, container = document.body) {
    const card = new SmartCoinAnalysCard(COIN_ONE, COIN_TWO);
    card.start(container);
    return card;
}


// document.addEventListener('DOMContentLoaded', () => {
//     showSmartCoinAnalysCard("XRP", "USDT");
// });
