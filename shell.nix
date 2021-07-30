{ pkgs }:
pkgs.mkShell {
  buildInputs = with pkgs;
    [ nodejs-16_x (yarn.override { nodejs = nodejs-16_x; }) ]
    ++ (pkgs.lib.optionals pkgs.stdenv.isDarwin
      (with pkgs.darwin.apple_sdk.frameworks; [ CoreServices ]));
  shellHook = ''
    export PATH=node_modules/.bin:$PATH
  '';
}
