import { Octokit } from "octokit";
/**
 * Estimates the number of seats that will be consumed by users who have not been assigned a license.
 * @param organization - The name of the organization.
 * @param repository - The name of the repository.
 * @param octokit - The Octokit instance for making requests.
 * @returns A promise that resolves to an array of usernames.
 */
export declare function estimateSeats(organization: string, repository: string, octokit: Octokit): Promise<string[]>;
//# sourceMappingURL=estimateSeats.d.ts.map