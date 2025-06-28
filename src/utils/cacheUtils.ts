export const saveCacheToLocalStorage = (key:string, cache:string) => {
    try {
        localStorage.setItem(key, JSON.stringify(cache));
    } catch (e) {
        console.error(`Failed to save cache to ${key}`, e);
    }
};

export const loadCacheFromLocalStorage = (key:string) => {
    const cacheString = localStorage.getItem(key);
    if (!cacheString) return {};

    try {
        return JSON.parse(cacheString);
    } catch (error) {
        console.error(`Failed to parse cache from ${key}`, error);
        return {};
    }
};

/**
 * Function to check cache first. If expired or not exist, it will call fetcher()
 * @param {string} key localStorage key
 * @param {string} query unique cache key for this query (e.g. search term)
 * @param {Function} fetcher a function to fetch new data (should return Promise)
 * @param {number} expiryMillis duration for cache to be valid (default 5 minutes)
 */
export const getCachedOrFetch = async (
    key : string,
    query : string,
    fetcher : Function,
    expiryMillis = 5 * 60 * 60 * 1000 // 5 jam
) => {
    const cache = loadCacheFromLocalStorage(key);
    const cachedEntry = cache[query];
    const now = Date.now();

    if (cachedEntry && now - cachedEntry.timestamp < expiryMillis) {
        return cachedEntry.data;
    }

    // Otherwise, fetch new data
    const data = await fetcher();
    cache[query] = { data, timestamp: now };
    saveCacheToLocalStorage(key, cache);
    console.log("Fetched from API and saved to cache");

    return data;
};


export const deleteCacheForSymbol = (symbol:string) => {
    const cachesToCheck = ['dividendCache', 'companyProfileCache'];
    cachesToCheck.forEach((cacheKey) => {
        const cache = loadCacheFromLocalStorage(cacheKey);
        if (cache[symbol]) {
            delete cache[symbol];
            saveCacheToLocalStorage(cacheKey, cache);
        }
    });
};
