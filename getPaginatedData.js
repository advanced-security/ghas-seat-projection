/**
 * Fetches paginated data from a given URL.
 * @param {string} url - The URL to fetch data from.
 * @param {Object} param - Additional parameters for the request.
 * @param {Object} octokit - The Octokit instance for making requests.
 * @returns {Promise<any[]>} - A promise that resolves to an array of data.
 */
export async function getPaginatedData(url, param, octokit) {
    const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;
    let pagesRemaining = true;
    let data = [];
  
    while (pagesRemaining) {
      try {
        const response = await octokit.request(`GET ${url}`, param);
        const parsedData = parseData(response.data);
        data = [...data, ...parsedData];
  
        const linkHeader = response.headers.link;
  
        pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);
  
        if (pagesRemaining) {
          url = linkHeader.match(nextPattern)[0];
        }
      } catch (error) {
        if (error.response) {
          throw new Error(
            `Error! Status: ${error.response.status}. Message: ${error.response.data.message}`
          );
        }
        if (
          error.response &&
          error.status === 403 &&
          error.response.headers["x-ratelimit-remaining"]
        ) {
          const rateLimitRemaining = Number(
            response.headers["x-ratelimit-remaining"]
          );
          if (rateLimitRemaining < 50) {
            throw new Error(
              "Rate limit is too low, please wait at least one hour until trying again."
            );
          }
        }
        throw new Error(error);
      }
    }
  
    return data;
  }
  
  function parseData(data) {
    // If the data is an array, return that
    if (Array.isArray(data)) {
      return data;
    }
  
    // Some endpoints respond with 204 No Content instead of empty array
    //   when there is no data. In that case, return an empty array.
    if (!data) {
      return [];
    }
  
    // Otherwise, the array of items that we want is in an object
    // Delete keys that don't include the array of items
    delete data.incomplete_results;
    delete data.repository_selection;
    delete data.total_count;
    // Pull out the array of items
    const namespaceKey = Object.keys(data)[0];
    data = data[namespaceKey];
  
    return data;
  }