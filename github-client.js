import "dotenv/config";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});


function parsePRUrl(url) {
  const urlSegments = url.split("/");
  const owner = urlSegments[3];
  const repo = urlSegments[4];
  const prNumber = parseInt(urlSegments[6], 10);
  return { owner, repo, prNumber };
}


export async function fetchPRDiff(prUrl) {
  // parse the PR URL to extract owner, repo, and PR number
  const { owner, repo, prNumber } = parsePRUrl(prUrl);

  // Create octokit instance with the GitHub token
  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff",
    },
  });

  return response.data;
}
