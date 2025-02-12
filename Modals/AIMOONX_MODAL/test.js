async function fetchCoinList() {
  const url = "http://188.34.202.221:8000/Market/GetMarketPair/";
  const token = "6ae3d79118083127c5442c7c6bfaf0b9";
  const params = {
    marketpair_id : 1
  }
  try {
    axios
      .post(url,params,  {
        headers: {
          'Accept': "application/json",
          "Content-Type": "application/json",
          'Authorization': token,
        },
      })
      .then ( async(response) => {
        console.log(response);
        
         console.log(response.data.coins);
         
      })
      .catch((error) => {
        console.error("There was an error making the request:", error);
      });
  } catch (error) {
    console.error("Error fetching coin list:", error);
  }
}

fetchCoinList();


