\NeedsTeXFormat{LaTeX2e}[2020/10/01]
\ProvidesClass{card-style}
  [2023/08/25 v0.01]

\LoadClass[DIV=21, fontsize=7.5pt]{scrartcl}
\KOMAoptions{paper=63mm:88mm, DIV=21, fontsize=7.5pt}

\RequirePackage{xcolor}
\RequirePackage{fontspec}
\RequirePackage{mathtools}
\RequirePackage{tikz}
\RequirePackage[warnings-off={mathtools-colon,mathtools-overbracket}]{unicode-math}
\RequirePackage{multicol}
\RequirePackage{xparse}
\RequirePackage[implicit=false]{hyperref}
\RequirePackage{bookmark}

\usetikzlibrary{svg.path}
\usetikzlibrary{fit}
\usetikzlibrary{backgrounds}

\input{fonts.tex}

\input{symbols.tex}

\setlength\parindent{0pt} % todo: avoid in favor of some komascript feature
\setlength\parskip{4pt} % todo: avoid in favor of some komascript feature

\addtokomafont{section}{\clearpage\normalfont\postamt}
\addtokomafont{subsection}{\normalfont\mittelschrift}

\renewcommand*{\sectionformat}{}
\renewcommand*{\subsectionformat}{}

\newcommand{\Category}[1]{\clearpage\bookmark[page=\thepage, level=0]{#1}}

\newcounter{cards}

\newcommand{\Card}[3]{%
  \clearpage

  % Check that last card fitted on one page
  \pgfmathparse{int(\value{cards})}
  \ifnum\pgfmathresult=0
    \pgfmathparse{int(\value{page})}
    \let\pageOfFirstCard\pgfmathresult
  \else
    \pgfmathparse{int(\value{page} - \pageOfFirstCard - \value{cards})}
    \ifnum\pgfmathresult=0
      % good
    \else
      \ClassWarning{card-style}{Previous card defined in \LastCardFilePath\space needed \pgfmathresult\space pages too much}
      % make sure remaining cards are not warned against, by pretending there were more cards
      \addtocounter{cards}{\pgfmathresult}
    \fi
  \fi
  % store current file in LastCardFilePath, in case it's needed later to produce a better error message
  \xdef\LastCardFilePath{\CurrentFilePath/\CurrentFile}

  \stepcounter{cards}

  \bookmark[page=\thepage, level=1]{#3 \ifnum\pdfstrcmp{#2}{}=0\else (#1 #2)\fi}%
  \section{#3 \hfill \color{gray} #1 #2}%
}

\pagestyle{empty}
