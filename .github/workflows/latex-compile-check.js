/**
This file is copied from https://github.com/James-Yu/LaTeX-Workshop/blob/6ee7aca5dfe057642fec1781b6810796d745862e/src/components/parserlib/latexlog.ts
and adapted from there
 
Copyright (c) 2016 James Yu
 
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

const fs = require('fs').promises;
const path = require('path');
//import { type IParser, type LogEntry, showCompilerDiagnostics } from './parserutils'

const messageBadboxShow = true;

const latexError = /^(?:(.*):(\d+):|!)(?: (.+) Error:)? (.+?)$/
const latexBox = /^((?:Over|Under)full \\[vh]box \([^)]*\)) in paragraph at lines (\d+)--(\d+)$/
const latexBoxAlt = /^((?:Over|Under)full \\[vh]box \([^)]*\)) detected at line (\d+)$/
const latexBoxOutput = /^((?:Over|Under)full \\[vh]box \([^)]*\)) has occurred while \\output is active(?: \[(\d+)\])?/
const latexWarn = /^((?:(?:Class|Package|Module) \S*)|LaTeX(?: \S*)?|LaTeX3) (Warning):\s+(.*?)(?: on(?: input)? line (\d+))?(\.|\?|)$/
const latexPackageWarningExtraLines = /^\((.*)\)\s+(.*?)(?: +on input line (\d+))?(\.)?$/
const bibEmpty = /^Empty `thebibliography' environment/
const biberWarn = /^Biber warning:.*WARN - I didn't find a database entry for '([^']+)'/

// const truncatedLine = /(.{77}[^\.](\w|\s|-|\\|\/))(\r\n|\n)/g
// A line with an error message will start with an 'l' character followed by a line number and then a space.
// After that it shows the line with the error but only up to the position of the error.
// If the error comes very late in the line, the error output will start with 3 dots.
// The regular expression is set up to include the 3 dots as an optional element, such that the capture group $2
// always contains actual text that appears in the line.
const messageLine = /^l\.\d+\s(\.\.\.)?(.*)$/

const buildLog = []

// type ParserState = {
//     searchEmptyLine: boolean,
//     insideBoxWarn: boolean,
//     insideError: boolean,
//     currentResult: LogEntry,
//     nested: number,
//     rootFile: string,
//     fileStack: string[]
// }

function initParserState(rootFile) {
    return {
        searchEmptyLine: false,
        insideBoxWarn: false,
        insideError: false,
        currentResult: { type: '', file: '', text: '', line: 1 },
        nested: 0,
        rootFile,
        fileStack: [ rootFile ]
    }
}

function parse(log, rootFile) {
    const lines = log.split('\n')
    buildLog.length = 0

    const state = initParserState(rootFile)
    for(const line of lines) {
        parseLine(line, state)
    }

    // Push the final result
    if (state.currentResult.type !== '' && !state.currentResult.text.match(bibEmpty)) {
        buildLog.push(state.currentResult)
    }
    return buildLog
}

function parseLine(line, state) {
    // Compose the current file
    const filename = path.join(path.dirname(state.rootFile), state.fileStack[state.fileStack.length - 1])
    // Skip the first line after a box warning, this is just garbage
    if (state.insideBoxWarn) {
        state.insideBoxWarn = false
        return
    }
    // Append the read line, since we have a corresponding result in the matching
    if (state.searchEmptyLine) {
        if (line.trim() === '' || (state.insideError && line.match(/^\s/))) {
            state.currentResult.text = state.currentResult.text + '\n'
            state.searchEmptyLine = false
            state.insideError = false
        } else {
            const packageExtraLineResult = line.match(latexPackageWarningExtraLines)
            if (packageExtraLineResult) {
                state.currentResult.text += '\n(' + packageExtraLineResult[1] + ')\t' + packageExtraLineResult[2] + (packageExtraLineResult[4] ? '.' : '')
                state.currentResult.line = packageExtraLineResult[3] ? parseInt(packageExtraLineResult[3], 10) : 1
            } else if (state.insideError) {
                const match = messageLine.exec(line)
                if (match && match.length >= 2) {
                    const subLine = match[2]
                    // remember the text where the error message occurred:
                    state.currentResult.errorPosText = subLine
                    // skip rest of error message (usually not useful)
                    state.searchEmptyLine = false
                    state.insideError = false
                } else {
                    state.currentResult.text = state.currentResult.text + '\n' + line
                }
            } else {
                state.currentResult.text = state.currentResult.text + '\n' + line
            }
        }
        return
    }
    let result = line.match(latexBox)
    if (!result) {
        result = line.match(latexBoxAlt)
    }
    if (result && messageBadboxShow) {
        if (state.currentResult.type !== '') {
            buildLog.push(state.currentResult)
        }
        state.currentResult = {
            type: 'typesetting',
            file: filename,
            line: parseInt(result[2], 10),
            text: result[1]
        }
        state.searchEmptyLine = false
        state.insideBoxWarn = true
        parseLine(line.substring(result[0].length), state)
        return
    }
    result = line.match(latexBoxOutput)
    if (result && messageBadboxShow) {
        if (state.currentResult.type !== '') {
            buildLog.push(state.currentResult)
        }
        state.currentResult = {
            type: 'typesetting',
            file: filename,
            line: 1,
            text: result[2] ? `${result[1]} in page ${result[2]}` : result[1]
        }
        state.searchEmptyLine = false
        parseLine(line.substring(result[0].length), state)
        return
    }
    result = line.match(latexWarn)
    if (result) {
        if (state.currentResult.type !== '') {
            buildLog.push(state.currentResult)
        }
        state.currentResult = {
            type: 'warning',
            file: filename,
            line: result[4] ? parseInt(result[4], 10) : 1,
            text: result[3] + result[5]
        }
        state.searchEmptyLine = true
        return
    }
    result = line.match(biberWarn)
    if (result) {
        if (state.currentResult.type !== '') {
            buildLog.push(state.currentResult)
        }
        state.currentResult = {
            type: 'warning',
            file: '',
            line: 1,
            text: `No bib entry found for '${result[1]}'`
        }
        state.searchEmptyLine = false
        parseLine(line.substring(result[0].length), state)
        return
    }

    result = line.match(latexError)
    if (result) {
        if (state.currentResult.type !== '') {
            buildLog.push(state.currentResult)
        }
        state.currentResult = {
            type: 'error',
            text: (result[3] && result[3] !== 'LaTeX') ? `${result[3]}: ${result[4]}` : result[4],
            file: result[1] ? path.join(path.dirname(state.rootFile), result[1]) : filename,
            line: result[2] ? parseInt(result[2], 10) : 1
        }
        state.searchEmptyLine = true
        state.insideError = true
        return
    }
    state.nested = parseLaTeXFileStack(line, state.fileStack, state.nested)
    if (state.fileStack.length === 0) {
        state.fileStack.push(state.rootFile)
    }
}

function parseLaTeXFileStack(line, fileStack, nested) {
    const result = line.match(/(\(|\))/)
    if (result && result.index !== undefined && result.index > -1) {
        line = line.substring(result.index + 1)
        if (result[1] === '(') {
            const pathResult = line.match(/^"?((?:(?:[a-zA-Z]:|\.|\/)?(?:\/|\\\\?))[^"()[\]]*)/)
            const mikTeXPathResult = line.match(/^"?([^"()[\]]*\.[a-z]{3,})/)
            if (pathResult) {
                fileStack.push(pathResult[1].trim())
            } else if (mikTeXPathResult) {
                fileStack.push(`./${mikTeXPathResult[1].trim()}`)
            } else {
                nested += 1
            }
        } else {
            if (nested > 0) {
                nested -= 1
            } else {
                fileStack.pop()
            }
        }
        nested = parseLaTeXFileStack(line, fileStack, nested)
    }
    return nested
}

async function main() {
  const log = await fs.readFile(process.argv[2], "utf8");
  const rootFile = process.argv[3];
  const result = parse(log, rootFile);


  //TODO Also support more than 50 warnings (we need to do multiple POST requests for that)
  const result50 = result.slice(0, 50);

  const apiPayload = {
    name: "latex-compile-check",
    head_sha: process.argv[4],
    conclusion: "neutral",
    output: {
      title: "LaTeX compile check",
      summary: `Found ${result.length} issues`,
      annotations: result50.map(finding => {
        return {
          path: finding.file,
          start_line: finding.line,
          end_line: finding.line,
          annotation_level: finding.type === "typesetting" ? "notice" : finding.type,
          message: finding.text
        }
      })
    }
  };

  console.log(JSON.stringify(apiPayload, null, 2));
}

main();