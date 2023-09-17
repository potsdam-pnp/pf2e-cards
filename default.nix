{ stdenv, texlive }:

stdenv.mkDerivation {
    name = "pf2e-cards";
    src = "${./.}";
    buildInputs = [ (texlive.combine { inherit (texlive) scheme-small latexmk; }) ];
    buildPhase = ''
      max_print_line=1000 latexmk -synctex=1 -interaction=nonstopmode -file-line-error -xelatex cards.tex a4print.tex
    '';
    installPhase = ''
        mkdir -p $out
        cp cards.pdf a4print.pdf metadata.txt cards.log $out
    '';
}
