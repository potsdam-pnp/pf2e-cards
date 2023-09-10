const fs = require("fs").promises;
const { exec } = require('node:child_process');

async function commentIssue(github, context, body) {
  if (!github) {
    console.log("No connection to github, would post the following comment");
    console.log("  " + body.split("\n").join("\n  "));
    return;
  }
  await github.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: body
  });
  console.log("Posted comment");
}

async function uploadFile(github, context, path, message, payload) {
  if (!github) {
    console.log("No connection to github, would upload file");
    console.log("  File path: ", path);
    console.log("  Commit message: ", message);
    console.log("  Base64 Payload: ", payload.substring(0, 50) + `... (${payload.length} bytes)`);
    return;
  }
  await github.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner: context.repo.owner,
    repo: 'pf2e-generated-card-images',
    path: path,
    message: message,
    content: payload,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
}

function extractImageOnPage(page) {
  return new Promise((resolve, reject) => {
    exec(`pdftoppm -f ${page} -l ${page} -png cards.pdf`, { 
      "encoding": "buffer"
    }, (error, stdout, stderr) => {
      if (error) reject(error);
      console.log(stderr.toString("utf8"));
      resolve(stdout.toString("base64"));
    });
  })
}

async function findAndUploadImage(github, context, metadataLines, searchString) {
  const matchingPages = [];
  let currentPage = 0;
  for (const line of metadataLines) {
    const cardNumber = /^page=(.*)$/.exec(line);
    if (cardNumber) {
      currentPage = cardNumber[1];
    }
    if (line.trim() === searchString) {
      matchingPages.push(currentPage);
    }
  }

  if (matchingPages.length == 0) {
    // Search with regexp instead of equality
    const matchingStrings = [];
    for (const line of metadataLines) {
      if (line.includes(searchString)) {
        matchingStrings.push(line.trim());
      }
    }
    if (matchingStrings.length > 0) {
      const tries = matchingStrings.map(x => "\tshow " + x).join("\n");
      return {
        prefix: `No card found for matching '${searchString}', maybe try one of the following instead?\n\`\`\`\n` + tries + "\n```\n",
        images: ""
      };
    } else {
      return {
        prefix: `No card found matching '${searchString}'\n`,
        images: ""
      };
    }
  }

  console.log(`Found ${matchingPages.length} matching pages`, matchingPages);
  
  const imagePayload = await extractImageOnPage(matchingPages[0]);
  const fileName = matchingPages[0] + ".png";

  await uploadFile(github, context, 
    process.env.sha + "/" + fileName,
    'upload files for some comment in ' + context?.payload?.comment?.html_url ?? "<unknown>",
    imagePayload
  );

  let prefix = '';
  if (matchingPages.length > 1) {
    prefix = `Found ${matchingPages.length} cards matching '${searchString}', showing only the first one.\n`;
  }
  const path = encodeURIComponent(process.env.sha) + "/" + fileName;
  return {
    prefix: prefix,
    images: '![' + fileName + '](https://raw.githubusercontent.com/potsdam-pnp/pf2e-generated-card-images/main/' + path + ') '
  }
}

async function main(github, context) {
  const metadataLines = (await fs.readFile("metadata.txt", "utf-8")).split("\n");
  const commentBody = process.env.commentBody ?? context.payload.comment.body;
  const searchStrings = commentBody.split("\n").flatMap(line => {
    const index = line.indexOf("/show ");
    if (index == -1) 
      return [];
    else
      return [line.substring(index + "/show ".length).trim()];
  });

  let prefix = "";
  let images = "";
  let suffix = "from " + process.env.sha;

  for (const searchString of searchStrings) {
    const result = await findAndUploadImage(github, context, metadataLines, searchString);
    prefix += result.prefix;
    images += result.images;
  }

  if (images == "") suffix = "";

  await commentIssue(github, context, prefix + "\n" + images + "\n" + suffix)
}

if (process.env.execute) { main() }

module.exports = main;