import { Octokit } from "octokit";
interface RequestParams {
    [key: string]: unknown;
    headers?: {
        "X-GitHub-Api-Version"?: string;
        [key: string]: string | undefined;
    };
}
/**
 * Fetches paginated data from a given URL.
 * @param url - The URL to fetch data from.
 * @param param - Additional parameters for the request.
 * @param octokit - The Octokit instance for making requests.
 * @returns A promise that resolves to an array of data.
 */
export declare function getPaginatedData(url: string, param: RequestParams, octokit: Octokit): Promise<unknown[]>;
export {};
//# sourceMappingURL=getPaginatedData.d.ts.map