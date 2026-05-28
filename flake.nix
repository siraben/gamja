{
  description = "gamja web IRC client";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.buildNpmPackage {
            pname = "gamja";
            version = "unstable";

            src = pkgs.lib.cleanSourceWith {
              src = ./.;
              filter =
                path: type:
                let
                  baseName = baseNameOf path;
                in
                !(type == "directory" && builtins.elem baseName [
                  ".parcel-cache"
                  "dist"
                  "node_modules"
                ]);
            };

            npmDepsHash = "sha256-9MUvDaMIDe9zkPXxcFYGOrHWYEfKqLJofc22w35dQK0=";
            npmFlags = [ "--include=dev" ];
            npmBuildScript = "build";

            installPhase = ''
              runHook preInstall

              mkdir -p $out/share/gamja
              cp -r dist/. $out/share/gamja/

              runHook postInstall
            '';
          };
        }
      );

      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.git
              pkgs.nodejs
              pkgs.prefetch-npm-deps
            ];
          };
        }
      );
    };
}
