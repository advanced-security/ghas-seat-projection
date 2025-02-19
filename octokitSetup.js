import { Octokit, App } from "octokit";
import core from "@actions/core";

/**
 * Sets up and returns an authenticated Octokit instance based on the provided authentication type.
 * @returns {Promise<Octokit>} A promise that resolves to an authenticated Octokit instance.
 */
export async function octokitSetup() {
  const authenticationType = core.getInput("authentication");

  if (authenticationType === "app") {
    const applicationId = core.getInput("application-id");
    const privateKey = core.getInput("application-private-key");
    const installationId = core.getInput("installation-id");

    const app = new App({
      appId: applicationId,
      privateKey: privateKey,
    });
    return await app.getInstallationOctokit(installationId);
  }
  if (authenticationType === "token") {
    const token = core.getInput("token");
    return new Octokit({ auth: token });
  }
}