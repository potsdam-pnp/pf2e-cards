#!/usr/bin/env node

const { Octokit } = require("octokit");
const latexCompileCheck = require("./latex-compile-check");


async function main() {
  const payload = await latexCompileCheck(process.argv[2], "cards.tex", process.env.SHA)
  
  if (process.env.GITHUB_TOKEN) {
    const github = new Octokit({
      "auth": process.env.GITHUB_TOKEN
    });

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

    await github.request('POST /repos/{owner}/{repo}/check-runs', {
      owner,
      repo,
      ...payload
    });
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

main();