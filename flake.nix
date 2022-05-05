{
  description = "Saber-common development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [
      "aarch64-darwin"
      "x86_64-linux"
      "x86_64-darwin"
    ]
      (system:
        let pkgs = import nixpkgs { inherit system; };
        in
        rec {
          packages.ci = pkgs.buildEnv {
            name = "ci";
            paths = with pkgs; [ nodejs yarn ];
          };
          devShell = pkgs.mkShell { buildInputs = [ packages.ci ]; };
        });
}
