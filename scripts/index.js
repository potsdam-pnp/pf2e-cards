import yargs from "yargs";
import { promises as fs } from "fs";
import { fileURLToPath } from 'url';
import path from "path";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function normalizeUrl(url) {
  const res = /^https:\/\/2e.aonprd.com\/(.*)$/.exec(url);
  if (res) {
    return res[1];
  } else if (url.startsWith("/")) {
    return url;
  } else {
    throw new Error("Unknown format of url: '" + url + "'");
  }
}

async function loadContent(argv) {
  if (argv.content) {
    const json = JSON.parse(await fs.readFile(argv.content, "utf8"));
    return json.flatMap(x => x.hits.hits.map(y => y._source));
  } else {
    throw new Error("Content location needs to be specified")
  }
}

function computeSourceReference(item) {
  const sourceBookRef = /^Core Rulebook pg. ([0-9]+)$/.exec(item.source_raw);
  if (sourceBookRef) {
    return "\\Reference{CRB}{" + sourceBookRef[1] + "}";
  } else {
    throw new Error("Can't parse source reference");
  }
}

async function main(argv) {
  const content = await loadContent(argv);
  let predicate;
  if (argv.name) predicate = (obj) => obj.name.toLowerCase() === argv.name.toLowerCase();
  if (argv.url) {
    const url = normalizeUrl(argv.url);
    predicate = (obj) => obj.url === url;
  }

  const res = content.filter(predicate);
  if (res.length === 0) {
    throw new Error("Element not found");
  } else if (res.length > 1) {
    throw new Error("multiple elements found")
  }

  const item = res[0];

  const sourceReference = computeSourceReference(item);

  let folderName = item.type.toLowerCase() + "s";
  const fileName = item.name.toLowerCase().replace(/ /g, "-") + ".tex";
  const fileContent = `
  % ${item.name}
  % https://2e.aonprd.com${item.url}

  \\Card{${item.type}}{}{${item.name}}


  \\vfill

  \\ItemPrice{${item.price_raw.replace(/ /, "")}}
  \\ItemBulk{${item.bulk_raw}}
  \\ItemHands{${item.hands}}
  \\hfill${sourceReference}
  `

  const rl = readline.createInterface({ input, output });

  const answer = await rl.question('Confirm folder name "' + folderName + '" (enter=confirm, otherwise propose new directory name): ');

  rl.close();
  
  if (answer != "") folderName = answer;

  const fullFolder = path.resolve(path.join(fileURLToPath(import.meta.url), "../../cards", folderName));
  const fullFilename = path.join(fullFolder, fileName);

  await fs.mkdir(fullFolder, { recursive: true });
  await fs.writeFile(fullFilename, fileContent, {
    flag: "wx",
    encoding: "utf-8"
  });


  const cardsTex = fullFolder + ".tex";

  //TODO: Write to correct location in cards.tex
  await fs.writeFile(cardsTex, `\\input{cards/${folderName}/${fileName}}\n`, {
    flags: "ax",
    encoding: "utf8"
  });

  console.log("Written to " + fullFilename);
  console.log("Written to " + cardsTex);


}

main(yargs(process.argv.slice(2))
  .option("url", {
    type: "string"
  })
  .option("name", {
    type: "string"
  })
  .option("content", {
    description: "Location of JSON array with definitions"
  })
  .conflicts("url", "name")
  .help()
  .argv);

