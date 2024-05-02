# Snyk.io Dynamic Plkugin for JanusIDP

This Bakctsage monorepo exists to convert the [backstage-plugin-snyk](https://github.com/snyk-tech-services/backstage-plugin-snyk) into a dynamic plugin for [Janus IDP](https://janus-idp.io/). 

Note that this repo contains some patch files to fix some of the dependencies that don't work with webpack 5. They will be automatically applied after `yarn install`.

To start the app, run:

```sh
yarn install
yarn dev
```

To build:

```sh
yarn workspace backstage-plugin-snyk export-dynamic
cd plugins/backstage-plugin-snyk/
npm pack
```

The result will be a tarball that you have then use as a dynamic plugin. Don't forget to calculate the integrity hash!

```sh 
shasum -a 256 backstage-plugin-snyk-0.0.0-development.tgz | awk '{print $1}' | xxd -r -p | base64
```