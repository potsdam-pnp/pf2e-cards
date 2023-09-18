{
  description = "pf2e-cards";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-23.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: 
      let pkgs = nixpkgs.legacyPackages.${system}; in {
        packages = rec {
          cards = import ./. pkgs;
          website = import ./website pkgs cards;
          default = cards;
        };
    }); 
}
