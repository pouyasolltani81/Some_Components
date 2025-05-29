class MoodAnalysisModal {
    constructor(symbol, container = document.body) {
      this.symbol = symbol;
      this.container = container;
      this.prefixId = `modal_${Math.random().toString(36).substring(2, 10)}`;
      this.triggerButton = null;
      this.modalElement = null;
      this.analysisButton = null;
      this.params = {
        useMood: true,
        useMarketData: true,
        useIndicator: true,
        timeframe: "4h",
        candleCount: 10,
      };
  
      this.createTriggerButton();
      this.createModal();
      this.addEventListeners();
    }
  
    createTriggerButton() {
      const btn = document.createElement("button");
      btn.className = "group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out rounded-lg bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span class="text-gray-700 group-hover:text-blue-600">Mood Analysis: ${this.symbol}</span>
        <div class="absolute inset-0 rounded-lg transition-opacity duration-200 opacity-0 group-hover:opacity-10 bg-blue-50"></div>
      `;
      this.triggerButton = btn;
    }
  
    createModal() {
      const modalHTML = `
        <div id="${this.prefixId}" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white w-full max-w-2xl p-6 rounded-xl shadow-xl">
            <div class="flex justify-between items-center border-b pb-3 mb-4">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 class="text-lg font-semibold text-gray-900">Mood Analysis for ${this.symbol}</h2>
              </div>
              <button class="close-button text-gray-500 hover:text-gray-800 text-xl">&times;</button>
            </div>
            <div class="space-y-4 text-sm text-gray-800">
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                ${this.buildSelect("Timeframe", "timeframe", ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"], this.params.timeframe)}
                ${this.buildNumber("Candles", "candleCount", this.params.candleCount)}
                ${this.buildToggle("Use Mood", "useMood", this.params.useMood)}
                ${this.buildToggle("Use Market", "useMarketData", this.params.useMarketData)}
                ${this.buildToggle("Use Indicator", "useIndicator", this.params.useIndicator)}
              </div>
              <button class="analysis-button w-full group relative inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out rounded-lg bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span class="text-gray-700 group-hover:text-blue-600">Run Mood Analysis</span>
                <div class="absolute inset-0 rounded-lg transition-opacity duration-200 opacity-0 group-hover:opacity-10 bg-blue-50"></div>
              </button>
              <div class="result hidden border-t pt-4 space-y-2"></div>
            </div>
          </div>
        </div>
      `;
      const div = document.createElement("div");
      div.innerHTML = modalHTML;
      this.modalElement = div.firstElementChild;
    }
  
    buildSelect(label, id, options, defaultVal) {
      return `
        <label class="flex flex-col">
          <span class="text-xs text-gray-500">${label}</span>
          <select id="${this.prefixId}_${id}" class="p-2 border rounded">
            ${options.map(val => `<option value="${val}" ${val === defaultVal ? "selected" : ""}>${val}</option>`).join("")}
          </select>
        </label>
      `;
    }
  
    buildToggle(label, id, checked) {
      return `
        <label class="flex items-center space-x-2">
          <input type="checkbox" id="${this.prefixId}_${id}" ${checked ? "checked" : ""} />
          <span class="text-xs text-gray-600">${label}</span>
        </label>
      `;
    }
  
    buildNumber(label, id, value) {
      return `
        <label class="flex flex-col">
          <span class="text-xs text-gray-500">${label}</span>
          <input type="number" id="${this.prefixId}_${id}" value="${value}" min="1" class="p-2 border rounded" />
        </label>
      `;
    }
  
    async fetchAnalysisData() {
      const submitUrl = "https://news.imoonex.ir/AIAnalyze/moodAnalyze/";
      const getUrl = "https://news.imoonex.ir/AIAnalyze/getLLMResponse/";
  
      const submitParams = {
        symbol: this.symbol,
        ...this.params,
        language: "en",
      };
  
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        Authorization: "e19ad04e557b1cc1fee6b60b4d421fef",
      };
  
      try {
        console.log("📤 Sending mood analysis request:", submitParams);
        const startResponse = await axios.post(submitUrl, submitParams, { headers });
        const taskId = startResponse.data.data;
        console.log("✅ Task ID:", taskId);
  
        while (true) {
          const getParams = { task_id: taskId };
          console.log("🔁 Polling:", getParams);
  
          const result = await axios.post(getUrl, getParams, { headers });
          console.log("📬 Response:", result.data);
  
          if (result.data.message === "completed" && result.data.return) {
            return result.data.data[0].result.response;
          }
  
          await new Promise(res => setTimeout(res, 2000));
        }
      } catch (err) {
        console.error("❌ Error:", err);
        return { error: "Fetch failed. Check console." };
      }
    }
  
    async runAnalysis() {
      const btn = this.analysisButton;
      const resultDiv = this.modalElement.querySelector(".result");
      resultDiv.classList.add("hidden");
      resultDiv.innerHTML = "";
  
      // collect params
      this.params = {
        useMood: this.modalElement.querySelector(`#${this.prefixId}_useMood`).checked,
        useMarketData: this.modalElement.querySelector(`#${this.prefixId}_useMarketData`).checked,
        useIndicator: this.modalElement.querySelector(`#${this.prefixId}_useIndicator`).checked,
        timeframe: this.modalElement.querySelector(`#${this.prefixId}_timeframe`).value,
        candleCount: parseInt(this.modalElement.querySelector(`#${this.prefixId}_candleCount`).value),
      };
  
      // UI: disable
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
      btn.innerHTML = `
        <svg class="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Analyzing...</span>
      `;
  
      const response = await this.fetchAnalysisData();
  
      // UI: restore
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-500 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span class="text-gray-700 group-hover:text-blue-600">Run Mood Analysis</span>
        <div class="absolute inset-0 rounded-lg transition-opacity duration-200 opacity-0 group-hover:opacity-10 bg-blue-50"></div>
      `;
  
      if (response.error) {
        resultDiv.innerHTML = `
          <div class="flex items-center gap-2 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ${response.error}
          </div>
        `;
      } else {
        const updatedAt = new Date(response.updatedAt * 1000).toLocaleString();
        resultDiv.innerHTML = `
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span><strong>Mood:</strong> ${response.Overal_investor_mood}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span><strong>Technical:</strong> ${response.Overal_technical_analysis}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span><strong>Strength:</strong> ${response.Indicator_trend_strength}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Overall Summary:</strong> ${response.Overal_market_analysis}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Updated:</strong> ${updatedAt}</span>
            </div>
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span><strong>Raw Summary:</strong> ${response.summary}</span>
            </div>
          </div>
        `;
      }
  
      resultDiv.classList.remove("hidden");
    }
  
    addEventListeners() {
      this.triggerButton.addEventListener("click", () => {
        this.modalElement.classList.remove("hidden");
      });
  
      this.modalElement.querySelector(".close-button").addEventListener("click", () => {
        this.modalElement.classList.add("hidden");
      });
  
      this.analysisButton = this.modalElement.querySelector(".analysis-button");
      this.analysisButton.addEventListener("click", () => this.runAnalysis());
    }
  
    start() {
      this.container.appendChild(this.triggerButton);
      this.container.appendChild(this.modalElement);
    }
  }

export default MoodAnalysisModal;

