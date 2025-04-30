import { getLLMResponse } from "./endpoints";

async function qwefetchCoinList(id) {
  const url = getLLMResponse;
  const token = "189b4bf96bf5de782515c1b4f0b2a2c7";
  const params = {
    task_id : id
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
        console.log('test responce' );

        console.log(response);
        
         
      })
      .catch((error) => {
        console.error("There was an error making the request:", error);
      });
  } catch (error) {
    console.error("Error fetching coin list:", error);
  }
}



