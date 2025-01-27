class SmartOrderChartCard {
    constructor(smartOrderId, prefixId, ismodal = true) {
        this.smartOrderId = smartOrderId;
        this.prefixId = prefixId;
        this.cardElement = null;
        this.chart = null;
        this.ismodal = ismodal
        this.createCard();
        this.addEventListeners();
    }

    createCard() {
        const closeButton = this.ismodal ? `
        <button id="${this.smartOrderId}_${this.prefixId}_close" class="p-2 text-gray-800 rounded-md">
        <i class="fas fa-times"></i>
        </button>
        ` : '';
        const cardHtml = `
        <div class="mt-1 bg-white rounded-lg p-4 mx-auto">
        <div class="flex justify-between items-center mb-4 p-4 border-b-2 border-dotted border-gray-300 rounded-md">
        <div class="flex items-center space-x-2">
        <i class="text-lg fas fa-chart-line text-blue-500"></i>
        <h3 id="${this.smartOrderId}_${this.prefixId}_pair" class="font-semibold text-blue-800 text-lg"></h3>
        <span class="text-gray-800"> Profit Analysis </span>
        </div>
        <div class="flex space-x-2 text-sm">
        <select id="${this.smartOrderId}_${this.prefixId}_interval_days"
        class="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
        <option value="1">Daily</option>
        <option value="7">Weekly</option>
        <option value="14">Bi-weekly</option>
        <option value="30">Monthly</option>
        </select>
        <button id="${this.smartOrderId}_${this.prefixId}_refresh"
        class="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 ease-in-out transform hover:scale-105">
        <i class="fas fa-sync-alt"></i>
        </button>
        ${closeButton}
        </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-4">
        <div class="bg-gray-50 rounded-lg w-full lg:w-96">
        <canvas id="${this.smartOrderId}_${this.prefixId}_profitChart" height="100"></canvas>
        </div>

        <div class="lg:w-auto flex lg:flex-col gap-7 space-x-4">
        <div class="bg-green-50 p-3 rounded-lg flex-1 ">
        <div class="text-sm text-gray-600">Total Profit</div>
        <div id="${this.smartOrderId}_${this.prefixId}_totalProfit" class="font-bold text-green-600">$0.00</div>
        </div>
        <div class="bg-blue-50 p-3 rounded-lg flex-1">
        <div class="text-sm text-gray-600">Best Day</div>
        <div id="${this.smartOrderId}_${this.prefixId}_bestDay" class="font-bold text-blue-600">-</div>
        </div>
        <div class="bg-red-50 p-3 rounded-lg flex-1">
        <div class="text-sm text-gray-600">Profit Per Day </div>
        <div id="${this.smartOrderId}_${this.prefixId}_ProfitPerDay" class="font-bold text-red-600">0%</div>
        </div>
        <div class="bg-gray-100 p-3 rounded-lg flex-1">
        <div class="text-sm text-gray-600">Avg Rate of Return</div>
        <div id="${this.smartOrderId}_${this.prefixId}_Avg_Rate_Of_Return" class="font-bold text-gray-600">0%</div>
        </div>
        <div class="bg-yellow-50 p-3 rounded-lg flex-1">
        <div class="text-sm text-gray-600">Avg Time Last</div>
        <div id="${this.smartOrderId}_${this.prefixId}_Avg_Time_Last" class="font-bold text-yellow-600">0%</div>
        </div>
        <div class="bg-purple-50 p-3 rounded-lg flex-1">
        <div class="text-sm text-gray-600">APY</div>
        <div id="${this.smartOrderId}_${this.prefixId}_APY" class="font-bold text-purple-600">0%</div>
        </div>
        </div>
        </div>
        </div>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml;
        this.cardElement = tempDiv.firstElementChild;
        return this.cardElement;
    }

    fetchChartData() {
        const intervalSelect = document.getElementById(`${this.smartOrderId}_${this.prefixId}_interval_days`);
        const intervalDays = intervalSelect ? intervalSelect.value : 1;

        fetch('/SmartOrder/getSmartOrderChartInfo/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                smart_order_id: this.smartOrderId,
                interval_days: parseInt(intervalDays)
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.return) {
                this.updateChart(data.profit_chart_data, data.smart_order);
                this.updateStats(data.profit_chart_data, data.smart_order);
            }
        });
    }

    updateChart(data, smartOrder) {
        const ctx = document.getElementById(`${this.smartOrderId}_${this.prefixId}_profitChart`).getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.date),
                               datasets: [{
                                   label: 'Closed and Archived Profit',
                                   data: data.map(item => item.profit.profit),
                               borderColor: 'rgb(59, 130, 246)',
                               backgroundColor: 'rgba(59, 130, 246, 0.1)',
                               fill: true,
                               tension: 0.4
                               },
                               {
                                   label: 'Archived Profit',
                                   data: data.map(item => item.profit.archived_profit),
                               borderColor: 'rgb(239, 68, 68)',
                               backgroundColor: 'rgba(239, 68, 68, 0.1)',
                               fill: true,
                               tension: 0.4
                               }
                               ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        // display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${parseFloat(context.raw).toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        display: false  // This hides the x-axis
                    },
                    y: {
                        // beginAtZero: true,
                        // ticks: {
                        //     callback: (value) => `$${parseFloat(value).toFixed(2)}`
                        // }
                        display: false
                    }
                }
            }
        });
    }

    updateStats(data, smartOrder) {
        if (data.length > 0) {

            document.getElementById(`${this.smartOrderId}_${this.prefixId}_pair`).textContent = `${smartOrder.starter_order.marketpair.pair.name}`;

            const totalProfit = parseFloat(data[data.length - 1].profit.profit);
            document.getElementById(`${this.smartOrderId}_${this.prefixId}_totalProfit`).innerHTML =
            `$${totalProfit.toFixed(2)}`+ '<span class="text-xs">'+' '+'(' + `${smartOrder.starter_order.marketpair.pair.base.symbol}` + ')</span>';

            let bestProfit = 0;
            let bestDate = '';
            for (let i = 1; i < data.length; i++) {
                const dailyProfit = parseFloat(data[i].profit.profit) - parseFloat(data[i-1].profit.profit);
                if (dailyProfit > bestProfit) {
                    bestProfit = dailyProfit;
                    bestDate = data[i].date;
                }
            }
            document.getElementById(`${this.smartOrderId}_${this.prefixId}_bestDay`).textContent = bestDate;

            const firstProfit = parseFloat(data[0].profit.profit);
            const lastProfit = parseFloat(data[data.length-1].profit.profit);
            const growthRate = ((lastProfit - firstProfit) / Math.abs(firstProfit || 1)) * 100;
            document.getElementById(`${this.smartOrderId}_${this.prefixId}_ProfitPerDay`).innerHTML =
            `${(totalProfit / smartOrder.extra_info.days_pass).toFixed(2)}` + '<span class="text-xs">'+' '+'(' + `${smartOrder.starter_order.marketpair.pair.base.symbol}` + ')</span>';

            document.getElementById(`${this.smartOrderId}_${this.prefixId}_Avg_Rate_Of_Return`).textContent =
            `${(smartOrder.extra_info.avg_rate_of_return * 100).toFixed(2)}%`;
            document.getElementById(`${this.smartOrderId}_${this.prefixId}_Avg_Time_Last`).innerHTML =
            `${smartOrder.extra_info.avg_time_last.toFixed(2)}h` + ' <span class="text-xs" title="total days">'+' '+'(' + `${smartOrder.extra_info.days_pass}` + ')</span>';
            document.getElementById(`${this.smartOrderId}_${this.prefixId}_APY`).textContent =
            `${smartOrder.extra_info.apy.toFixed(2)}%`;
        }
    }


    addEventListeners() {
        setTimeout(() => {
            const intervalSelect = document.getElementById(`${this.smartOrderId}_${this.prefixId}_interval_days`);
            const refreshButton = document.getElementById(`${this.smartOrderId}_${this.prefixId}_refresh`);

            if (intervalSelect) {
                intervalSelect.addEventListener('change', () => this.fetchChartData());
            }

            if (refreshButton) {
                refreshButton.addEventListener('click', () => this.fetchChartData());
            }

            const closeButton = document.getElementById(`${this.smartOrderId}_${this.prefixId}_close`);
            if (closeButton) {
                closeButton.addEventListener('click', () => hideSmartOrderChartModal());
            }
        }, 0);

        document.addEventListener('keydown', this.handleKeyDown);
    }

    start() {
        this.fetchChartData();
    }

    stop() {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    handleKeyDown = (event) => {
        if (event.key === 'Escape' && this.ismodal) {
            this.stop();
            hideSmartOrderChartModal();
        }
    }
}

function showSmartOrderChartCard(smartOrderId, prefixId, ismodal = true) {
    const card = new SmartOrderChartCard(smartOrderId, prefixId, ismodal);
    card.start();
    return card;
}

//////////////////////////////////////////////////////////////////////////////
class SmartCoinAnalysCard {
    constructor(COIN_ONE, COIN_TWO) {
        this.smartOrderId = COIN_ONE;
        this.prefixId = COIN_TWO;
        this.cardElement = null;
        this.chart = null;
        this.createCard();
        this.addEventListeners();
    }



    createCard() {

        const CardHTML =`
        <div class=" w-[700px] bg-violet-100 rounded-xl p-6 border-4 " dir="ltr">

        <div class="p-4 flex justify-between">

        <div class="hover:text-red-800 cursor-pointer">X</div>
        <div>Coin Analysis</div>
        <div></div>

        </div>

        <div class="flex flex-col gap-2 transition-all" id="InputForm">


        <div class="p-4 border-1 border-black rounded-xl bg-violet-200">XRP/USDT</div>

        <div class="p-4 flex justify-between">

        <div class="flex">

        <div class="text-gray-600 pr-2">time frame :</div>
        <div>4H</div>

        </div>


        <div class="flex">

        <div class="text-gray-600 pr-2">candle count :</div>
        <div>10</div>

        </div>


        </div>


        <div class="flex p-4 justify-between">

        <div class="flex">

        <div class="text-gray-600 pr-2 ">Use News :</div>
        <div class="text-green-800 cursor-pointer">True</div>

        </div>

        <div class="flex">

        <div class="text-gray-600 pr-2">Use Market Data :</div>
        <div class="text-green-800 cursor-pointer">True</div>

        </div>

        <div class="flex">

        <div class="text-gray-600 pr-2">Use Indicator :</div>
        <div class="text-red-800 cursor-pointer">False</div>

        </div>


        </div>


        <div class=" w-full p-4 text-center bg-yellow-200 rounded-xl border-1 border-gray-800 hover:bg-yellow-300 cursor-pointer" id="AnalysisButton">
        analyse
        </div>





        </div>

        <div class=" w-full p-4 text-center bg-yellow-200 rounded-xl  scale-y-0 transition hidden" id="WaitingMessage">
        We are analysing the news . Please wait ...
        </div>

        <div class="flex flex-col transition-all scale-y-0 hidden" id="AnalisisAnswer">

        <div class="flex justify-between p-4">
        <div>
        <div>XRP/USDT   icon</div>
        <div>XRP/USDT</div>
        </div>

        <div class="p-4 bg-green-100 rounded-xl">kharid</div>

        </div>


        <div class="flex justify-between p-4">
        <div class="flex ">

        <div class="text-gray-600 pr-2">Patern :</div>
        <div>somthing good</div>

        </div>


        <div class="flex ">

        <div class="text-gray-600 pr-2">duration :</div>
        <div>2 weeks</div>

        </div>


        <div class="flex ">

        <div class="text-gray-600 pr-2">updated at : </div>
        <div>1/1/1</div>

        </div>
        </div>

        <div class="flex flex-col p-4">

        <div class="text-gray-600">analysis :</div>
        <div class="break-words">A summery about how the model is analysing the coin  using the relevant news and in the selected time frame. if you have used market data and indicator there is a chance that the model analys the pair coin more accuratly.</div>

        </div>


        <div class="flex justify-between p-4 gap-2">
        <div class=" p-2 rounded-xl cursor-pointer text-2xl"> < </div>

        <div class="bg-gray-50 p-2 rounded-xl cursor-pointer">Breaking Newws</div>
        <div class="bg-gray-50 p-2 rounded-xl cursor-pointer">Breaaking Newws</div>
        <div class="bg-gray-50 p-2 rounded-xl cursor-pointer">Breaking News</div>

        <div class="p-2 rounded-xl cursor-pointer text-2xl">></div>
        </div>



        </div>

        </div>`

       
       

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = CardHTML;
        this.cardElement = tempDiv.firstElementChild;
        return this.cardElement;
    }


    addEventListeners() {
        setTimeout(() => {

            document.getElementById("AnalysisButton").addEventListener('click' , ()=> {
                document.getElementById('InputForm').classList.add('scale-y-0')
                setTimeout(() => {
                    document.getElementById('InputForm').classList.add('hidden')
                    document.getElementById('WaitingMessage').classList.remove('hidden')
                    document.getElementById('WaitingMessage').classList.remove('scale-y-0')

                }, 300);

                setTimeout(() => {
                    document.getElementById('WaitingMessage').classList.add('scale-y-0')
                    setTimeout(() => {
                        document.getElementById('WaitingMessage').classList.add('hidden')
                        document.getElementById('AnalisisAnswer').classList.remove('hidden')
                        document.getElementById('AnalisisAnswer').classList.remove('scale-y-0')
                    }, 300);
                }, 2000);


            })

        }, 0);

        document.addEventListener('keydown', this.handleKeyDown);
    }

    start() {
        // this.fetchChartData();
    }

    stop() {
        if (this.chart) {
            this.chart.destroy();
        }


    }

}
function showSmartCoinAnalysCard(COIN_ONE, COIN_TWO) {
    const card = new SmartCoinAnalysCard(COIN_ONE, COIN_TWO);
    card.start();
    return card;
}

console.log(showSmartCoinAnalysCard('123','123'));


// document.getElementById("AnalysisButton").addEventListener('click' , ()=> {
//     document.getElementById('InputForm').classList.add('scale-y-0')
//     setTimeout(() => {
//         document.getElementById('InputForm').classList.add('hidden')
//         document.getElementById('WaitingMessage').classList.remove('hidden')
//         document.getElementById('WaitingMessage').classList.remove('scale-y-0')
        
//     }, 300);

//     setTimeout(() => {
//         document.getElementById('WaitingMessage').classList.add('scale-y-0')
//         setTimeout(() => {
//             document.getElementById('WaitingMessage').classList.add('hidden')
//             document.getElementById('AnalisisAnswer').classList.remove('hidden')
//             document.getElementById('AnalisisAnswer').classList.remove('scale-y-0')
//         }, 300);
//     }, 2000);


// })
