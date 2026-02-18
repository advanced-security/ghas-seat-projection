import core from "@actions/core";
import { estimateSeats } from "./estimateSeats.js";
import { octokitSetup } from "./octokitSetup.js";
try {
    const org = core.getInput("organization");
    const repo = core.getInput("repository");
    const octokit = await octokitSetup();
    const handles = await estimateSeats(org, repo, octokit);
    core.setOutput("ghas-handles", handles);
    core.setOutput("ghas-seats", handles.length);
}
catch (error) {
    console.error(error);
    if (error instanceof Error) {
        core.setFailed(error.message);
    }
    else {
        core.setFailed(String(error));
    }
}
//# sourceMappingURL=index.js.map