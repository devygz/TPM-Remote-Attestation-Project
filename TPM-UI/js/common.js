const API_HOST = "http://tpm-server.yagz.eu:8001"


function getRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  
  // Calculate difference in seconds
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  // Use Intl.RelativeTimeFormat for clean, localized output
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    if (diffInSeconds >= secondsInUnit || unit === 'second') {
      const value = Math.floor(diffInSeconds / secondsInUnit);
      return rtf.format(-value, unit);
    }
  }
}

async function fetchData(url) {
  try {
    const response = await fetch(API_HOST + url);


    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }


    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("Could not fetch data:", error);
    return null; 
  }
}

async function postData(url, data = {}) {
  try {
    const response = await fetch(API_HOST + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", 
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Could not post data:", error);
    return null;
  }
}

const PCR_KEYS_MAP = {
    "tpm_PCR0" : "BIOS FW, Microcode",
    "tpm_PCR1" : "BIOS Configuraton",
    "tpm_PCR2" : "Option ROMs",
    "tpm_PCR3" : "Option ROM Configuration",
    "tpm_PCR4" : "UEFI Boot Manager",
    "tpm_PCR5" : "Boot Device Configuration + GPT Table",
    "tpm_PCR6" : "Host Manufacturer Specific",
    "tpm_PCR7" : "Secure Boot Keys"
}