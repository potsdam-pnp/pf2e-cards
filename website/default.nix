{ stdenv, rubyPackages, glibcLocales, git, pdftk, poppler_utils, ... }: cards: 

stdenv.mkDerivation {
  name = "pf2e-cards-website";
  src = ./content;

  buildInputs = [ rubyPackages.github-pages glibcLocales git pdftk poppler_utils ];

  LANG = "en_US.UTF-8";

  buildPhase = ''
    mkdir -p _includes
    sed -n '/Open Game Content/,$p' ${../README.md} > _includes/LICENSES.md
    cp ${cards}/*.pdf .
    sh ${./generate-preview-images.sh}
    github-pages build
  '';

  installPhase = ''
    cp -R _site $out
  '';
}