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

\input{card-filter.tex}

\setlength\parindent{0pt} % todo: avoid in favor of some komascript feature
\setlength\parskip{4pt} % todo: avoid in favor of some komascript feature

\addtokomafont{section}{\normalfont\postamt}
\addtokomafont{subsection}{\normalfont\mittelschrift}

% move the card headings higher (into the page border?)
% TODO: don't hardcode the beforeskip like this here, it's currently calculated as
% 2*(baselineskip in section heading)-(baselineskip before section heading)
% to typeset it as if there was no content beforehand
\RedeclareSectionCommand[runin=false, afterindent=false, beforeskip=-16.91999pt]{section}

\renewcommand*{\sectionformat}{}
\renewcommand*{\subsectionformat}{}

\newcommand{\Category}[1]{\clearpage\bookmark[page=\thepage, level=0]{#1}}

\newcounter{cards}

\newif\ifCardStyle@shouldDrawBorder
\pgfkeys{
  /cardStyle border/.is family, /cardStyle border,
%
  shouldDrawBorder/.is if=CardStyle@shouldDrawBorder,
  color/.estore in = \cardStyle@borderColor,
  color/.append style = shouldDrawBorder,
%
  default/.style = {
    shouldDrawBorder=false
  },
%
  type/.is choice,
  type/.add code={\ifnum \pdfstrcmp{#1}{}=0\else}{\fi}, % don't do anything for an empty type
%
  type/.cd,
  Item/.style      = {color=blue!40},
  Action/.style    = {color=yellow!40},
  Spell/.style     = {color=green!40},
  Cantrip/.style   = {color=green!40},
  Focus/.style     = {color=green!40},
  Rule/.style      = {color=gray!40},
  Condition/.style = {color=gray!40},
  .unknown/.style  = {shouldDrawBorder=false}
}

\newcommand{\cardStyle@drawCardFrame}[1]{%
  \pgfkeys{/cardStyle border, default, type=#1}

  \ifCardStyle@shouldDrawBorder
    \tikz[remember picture,overlay] {%
      \draw [color=\cardStyle@borderColor,rounded corners=4mm,line width=4mm]
        (current page.north east)
        +(-24mm,0mm) coordinate(a)
        +(0mm, -3mm) coordinate(b)
        
        (current page.north west) 
        {[rounded corners=0mm]--(a)} 
        {[rounded corners=1mm]--(a |- b)}
        {[rounded corners=0mm]--(b)}
        --(current page.south east)  
        --(current page.south west)
        --cycle
        (a) -- (current page.north east)
            -- +(1mm,0mm);
    }
  \fi
}

\xdef\cardStyle@currentCardCategory{None}
\AddToHook{shipout/background}{\cardStyle@drawCardFrame{\cardStyle@currentCardCategory}}

% Code to swallow cards that should not be visible
\def\cardStyle@swallowCode#1{
  \ifnum\pdfstrcmp{#1}{card}=0%
    \end{card}%
  \else
    \expandafter\cardStyle@swallowContent
  \fi
}

\long\def\cardStyle@swallowContent#1{%
  \def\a{#1}%
  \def\b{\end}%
  \ifx\a\b
    \expandafter\cardStyle@swallowCode
  \else
    \expandafter\cardStyle@swallowContent
  \fi
}

% \begin{card}{<card-type>}{<level>}{<title>}[<source-book>][<source-page>]
% ...
% \end{card}
% TODO: make reference mandatory, but we need to define all the references first
\NewDocumentEnvironment{card}{mmmoo}{%
  \pgfkeys{/card filter, type=#1, level=#2, title=#3, source book=#4, compute}%
  \ifvisible
%
  \clearpage%
%
  % Check that last card fitted on one page
  \pgfmathparse{int(\value{cards})}
  \ifnum\pgfmathresult=0
    \pgfmathparse{int(\value{page})}
    \xdef\pageOfFirstCard{\pgfmathresult}
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

  \xdef\cardStyle@currentCardCategory{#1}

  \stepcounter{cards}

  \bookmark[page=\thepage, level=1]{#3 \ifnum\pdfstrcmp{#2}{}=0\else (#1 #2)\fi}%
  \raisebox{0pt}[0pt][0pt]{}%
  \hfill\raisebox{1.2em}[0pt][0pt]{\normalfont\postamt#1 #2}%
  \section{#3 \hfill \IfValueT{#4}{\IfValueT{#5}{\Reference{#4}{#5}}}}%
  \else
    \expandafter\cardStyle@swallowContent
  \fi
}{}

\pagestyle{empty}
