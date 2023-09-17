{
  description = "pf2e-cards";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-23.05";
  };

  outputs = { self, nixpkgs }: 
    rec {
      packages.x86_64-linux.default = import ./default.nix  { inherit (nixpkgs.legacyPackages.x86_64-linux)  stdenv texlive; };
      packages.x86_64-darwin.default = import ./default.nix { inherit (nixpkgs.legacyPackages.x86_64-darwin) stdenv texlive; };

      packages.x86_64-linux.website = import ./website (nixpkgs.legacyPackages.x86_64-linux) packages.x86_64-linux.default;
      packages.x86_64-darwin.website = import ./website (nixpkgs.legacyPackages.x86_64-darwin) packages.x86_64-darwin.default;
    };
}
