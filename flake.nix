{
  description = "pf2e-cards";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-23.05";
  };

  outputs = { self, nixpkgs }: 
    {
      packages.x86_64-linux.default = import ./default.nix  { inherit (nixpkgs.legacyPackages.x86_64-linux)  stdenv texlive; };
      packages.x86_64-darwin.default = import ./default.nix { inherit (nixpkgs.legacyPackages.x86_64-darwin) stdenv texlive; };
    };
}
