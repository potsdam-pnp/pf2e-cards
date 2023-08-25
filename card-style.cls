\NeedsTeXFormat{LaTeX2e}[1994/06/01]
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

\newcommand{\Card}[3]{\section{#3 \hfill \color{gray} #1 #2}}

\pagestyle{empty}
