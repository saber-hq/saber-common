{
  description = "Saber-common development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        with pkgs;
        rec {
          packages.ci = buildEnv {
            name = "ci";
            paths = [ nodejs yarn nixpkgs-fmt bash ];
          };
          devShell = mkShell { buildInputs = [ packages.ci ]; };
        });
}
