async function fetchCoinList() {
  const url = "http://188.34.202.221:8000/Coin/ListCoins/";
  const token = "6ae3d79118083127c5442c7c6bfaf0b9";
  try {
    axios
      .get(url, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          Authorization: token,
        },
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