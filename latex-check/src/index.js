#!/usr/bin/env node

const { Octokit } = require("octokit");
const latexCompileCheck = require("./latex-compile-check");


async function main() {
  const payload = await latexCompileCheck(process.argv[2], "cards.tex", process.env.SHA)
  
  if (process.env.GITHUB_TOKEN) {
    const github = new Octokit({
      "auth": process.env.GITHUB_TOKEN
    });

    await github.request('POST /repos/{repo}/check-runs', {
      repo: process.env.GITHUB_REPOSITORY,
      ...payload
    });
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

main();