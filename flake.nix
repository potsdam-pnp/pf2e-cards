{
  description = "pf2e-cards";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-23.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  nixConfig = {
    extra-substituters = "https://potsdam-pnp.cachix.org";
    extra-trusted-public-keys = "potsdam-pnp.cachix.org-1:ZbQQiYz7KI9iZLOwECW6ErfJLFowbVOrNUF7PXJGLhw=";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: 
      let pkgs = nixpkgs.legacyPackages.${system}; in rec {
        packages = rec {
          cards = import ./. pkgs;
          website = import ./website pkgs cards;
          latex-check = import ./latex-check pkgs;

          default = cards;
        };

        apps = {
          default =
            let websitePath = pkgs.runCommand "pf2e-website" {} ''
              mkdir $out
              ln -s ${packages.website} $out/pf2e-cards
            ''; in {
              type = "app";
              program = "${pkgs.writeScript "card-website" ''
                #! ${pkgs.stdenv.shell}
                ${pkgs.nodePackages.http-server}/bin/http-server ${websitePath} "$@"
              ''}";
            };
        };
    });
}
