/**
 * Fetches paginated data from a given URL.
 * @param url - The URL to fetch data from.
 * @param param - Additional parameters for the request.
 * @param octokit - The Octokit instance for making requests.
 * @returns A promise that resolves to an array of data.
 */
export async function getPaginatedData(url, param, octokit) {
    const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;
    let pagesRemaining = true;
    let data = [];
    while (pagesRemaining) {
        try {
            const response = (await octokit.request(`GET ${url}`, param));
            const parsedData = parseData(response.data);
            data = [...data, ...parsedData];
            const linkHeader = response.headers.link;
            pagesRemaining = linkHeader !== undefined && linkHeader.includes(`rel=\"next\"`);
            if (pagesRemaining && linkHeader) {
                const match = linkHeader.match(nextPattern);
                if (match) {
                    url = match[0];
                }
            }
        }
        catch (error) {
            const err = error;
            if (err.response) {
                if (err.response.headers["x-ratelimit-remaining"]) {
                    const rateLimitRemaining = Number(err.response.headers["x-ratelimit-remaining"]);
                    if (rateLimitRemaining < 50) {
                        throw new Error("Rate limit is too low, please wait at least one hour until trying again.");
                    }
                }
                throw new Error(`Error! Status: ${err.response.status}. Message: ${err.response.data.message}`);
            }
            throw new Error(error instanceof Error ? error.message : String(error));
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
    const dataObj = data;
    delete dataObj.incomplete_results;
    delete dataObj.repository_selection;
    delete dataObj.total_count;
    // Pull out the array of items
    const namespaceKey = Object.keys(dataObj)[0];
    const result = dataObj[namespaceKey];
    return Array.isArray(result) ? result : [];
}
//# sourceMappingURL=getPaginatedData.js.map