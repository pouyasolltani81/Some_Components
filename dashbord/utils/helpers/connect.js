

async function connect(url, token, params, source, logging = false) {
  try {
    if (logging) {
      console.log(`📤 Sending request from  ${source} to :`, { url, params });
    }

    const response = await axios.post(url, params, {
      headers: {
        'Accept': "application/json",
        "Content-Type": "application/json",
        'Authorization': token,
      },
    });
    
    if (logging) {
      console.log(`✅ Response from ${source}:`, response.data);
    }
    
    return response.data;
  } catch (error) {
    if (logging) {
      console.error(`❌ Error from ${source} request:`, error);
    }
    throw error;
  }
}

export default connect;



