{ stdenv, rubyPackages, glibcLocales, git, pdftk, poppler_utils, ... }: cards: 

stdenv.mkDerivation {
  name = "pf2e-cards-website";
  src = ./content;

  nativeBuildInputs = [ rubyPackages.github-pages glibcLocales git pdftk poppler_utils ];

  LANG = "en_US.UTF-8";

  # The build on MacOS appears to not be completely seperated, so to
  # make the github-metadata plugin behave correctly, we set the url
  # to some non-existing domain
  PAGES_API_URL=https://no-internet-allowed.example.org;

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