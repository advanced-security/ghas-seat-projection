import { getPaginatedData } from "./getPaginatedData.js";

/**
 * Estimates the number of seats that will be consumed by users who have not been assigned a license.
 * @param {string} organization - The name of the organization.
 * @param {string} repository - The name of the repository.
 * @param {Object} octokit - The Octokit instance for making requests.
 * @returns {Promise<string[]>} - A promise that resolves to an array of usernames.
 */
export async function estimateSeats(
  organization,
  repository,
  octokit
) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago date
  let branches = new Set();
  let uniqueCommiters = new Set();
  let usersWithLicenceActive = new Set();
  let usersWithoutLicence = new Set();

  const rateLimit = await octokit.request("GET /rate_limit", {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (rateLimit.data.resources.core.remaining < 50) {
    throw new Error(
      "Rate limit is too low, please wait at least one hour until trying again."
    );
  }

  const branchesResponse = await getPaginatedData(
    "/repos/{owner}/{repo}/branches",
    {
      owner: organization,
      repo: repository,
      per_page: 100,
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    },
    octokit
  );

  branchesResponse.forEach((branch) => {
    if (branch !== null && branch.name !== null) {
      branches.add(branch.name);
    }
  });

  for (const branch of branches) {
    const commitsResponse = await getPaginatedData(
      "/repos/{owner}/{repo}/commits",
      {
        owner: organization,
        repo: repository,
        sha: branch,
        per_page: 100,
        since: since,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      octokit
    );
    commitsResponse.forEach((commit) => {
      if (commit.author !== null && commit.author.login !== null) {
        uniqueCommiters.add(commit.author.login);
      }
    });
  }

  const usersWithLicenceActiveResponse = await getPaginatedData(
    "/orgs/{org}/settings/billing/advanced-security",
    {
      org: organization,
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
    octokit
  );

  usersWithLicenceActiveResponse.forEach((repo) => {
    if (repo !== null && repo.advanced_security_committers_breakdown !== null) {
      repo.advanced_security_committers_breakdown.forEach((user) => {
        if (user.user_login !== null) {
          usersWithLicenceActive.add(user.user_login);
        }
      });
    }
  });

  uniqueCommiters.forEach((commiter) => {
    if (!usersWithLicenceActive.has(commiter)) {
      usersWithoutLicence.add(commiter);
    }
  });

  const allOrgMembersResponse = await getPaginatedData(
    "/orgs/{org}/members",
    {
      org: organization,
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
    octokit
  );

  const allOrgMembers = allOrgMembersResponse.map((member) => member.login);

  usersWithoutLicence.forEach((user) => {
    if (!allOrgMembers.includes(user)) {
      usersWithoutLicence.delete(user);
    }
  });

  return Array.from(usersWithoutLicence);
}