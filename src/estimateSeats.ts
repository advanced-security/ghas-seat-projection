import { Octokit } from "octokit";
import { getPaginatedData } from "./getPaginatedData.js";

interface Branch {
  name: string | null;
}

interface CommitAuthor {
  login: string | null;
}

interface Commit {
  author: CommitAuthor | null;
}

interface AdvancedSecurityUser {
  user_login: string | null;
}

interface RepositoryWithCommitters {
  advanced_security_committers_breakdown: AdvancedSecurityUser[] | null;
}

interface OrgMember {
  login: string;
}

interface RateLimitResponse {
  data: {
    resources: {
      core: {
        remaining: number;
      };
    };
  };
}

/**
 * Estimates the number of seats that will be consumed by users who have not been assigned a license.
 * @param organization - The name of the organization.
 * @param repository - The name of the repository.
 * @param octokit - The Octokit instance for making requests.
 * @returns A promise that resolves to an array of usernames.
 */
export async function estimateSeats(
  organization: string,
  repository: string,
  octokit: Octokit
): Promise<string[]> {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago date
  const branches = new Set<string>();
  const uniqueCommitters = new Set<string>();
  const usersWithLicenceActive = new Set<string>();
  const usersWithoutLicence = new Set<string>();

  const rateLimit = (await octokit.request("GET /rate_limit", {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })) as RateLimitResponse;

  if (rateLimit.data.resources.core.remaining < 50) {
    throw new Error(
      "Rate limit is too low, please wait at least one hour until trying again."
    );
  }

  const branchesResponse = (await getPaginatedData(
    "/repos/{owner}/{repo}/branches",
    {
      owner: organization,
      repo: repository,
      per_page: 100,
      headers: { "X-GitHub-Api-Version": "2022-11-28" },
    },
    octokit
  )) as Branch[];

  branchesResponse.forEach((branch) => {
    if (branch !== null && branch.name !== null) {
      branches.add(branch.name);
    }
  });

  for (const branch of branches) {
    const commitsResponse = (await getPaginatedData(
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
    )) as Commit[];
    commitsResponse.forEach((commit) => {
      if (commit.author !== null && commit.author.login !== null) {
        uniqueCommitters.add(commit.author.login);
      }
    });
  }

  const usersWithLicenceActiveResponse = (await getPaginatedData(
    "/orgs/{org}/settings/billing/advanced-security",
    {
      org: organization,
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
    octokit
  )) as RepositoryWithCommitters[];

  usersWithLicenceActiveResponse.forEach((repo) => {
    if (repo !== null && repo.advanced_security_committers_breakdown !== null) {
      repo.advanced_security_committers_breakdown.forEach((user) => {
        if (user.user_login !== null) {
          usersWithLicenceActive.add(user.user_login);
        }
      });
    }
  });

  uniqueCommitters.forEach((committer) => {
    if (!usersWithLicenceActive.has(committer)) {
      usersWithoutLicence.add(committer);
    }
  });

  const allOrgMembersResponse = (await getPaginatedData(
    "/orgs/{org}/members",
    {
      org: organization,
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
    octokit
  )) as OrgMember[];

  const allOrgMembers = allOrgMembersResponse.map((member) => member.login);

  usersWithoutLicence.forEach((user) => {
    if (!allOrgMembers.includes(user)) {
      usersWithoutLicence.delete(user);
    }
  });

  return Array.from(usersWithoutLicence);
}
