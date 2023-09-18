{ buildNpmPackage, lib, ... }: 


buildNpmPackage rec {
  pname = "latex-check";
  version = "0.1.0";

  src = ./src;
  npmDepsHash = "sha256-LXPdXaxhdYn5sptCBI3fEGiNatFg4OmDcu9kx009rN8=";
}