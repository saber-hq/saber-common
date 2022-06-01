{
  description = "Saber-common development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = import nixpkgs { inherit system; };
        in
        rec {
          packages.ci = pkgs.buildEnv {
            name = "ci";
            paths = with pkgs; [ nodejs yarn nixpkgs-fmt ];
          };
          devShell = pkgs.mkShell { buildInputs = [ packages.ci ]; };
        });
}
