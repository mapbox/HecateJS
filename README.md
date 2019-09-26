<h1 align='center'>HecateJS</h1>

<p align='center'>Javascript Library and CLI for <a href='https://github.com/mapbox/Hecate'>Hecate</a>, the persistent, mutable data store focused on GeoJSON first interchange</p>

## General Usage

### Installation

**JS Library**

```sh
yarn add '@mapbox/hecatejs'
```

**CLI**

```sh
yarn global add `@mapbox/hecatejs'
```

<h3 align=center>Instantiation</h3>

<details>

Note: if the username & password is not explicitly set, Hecate will fallback to checking for
a `HECATE_USERNAME` & `HECATE_PASSWORD` environment variable. For the `url` parameter, be sure to include the protocol and (if necessary) port number.

**JS Library**

```js
const Hecate = require('@mapbox/hecatejs');

const hecate = new Hecate({
    username: 'ingalls',
    password: 'yeaheh',
    url: 'https://example.com/hecate',
});
```

**CLI**

The CLI tool must be provided the URL to connect to for each subcommand.
This can be accomplished by providing the URL to a local or remote Hecate server. Be sure to include the protocol and, for local connections, the port number.

The --url option must be provided for every subcommand but is omitted in this guide for clarity.

```sh
# Connecting to a remote hecate server
./cli.js --url 'https://example.com'
```

```sh
# Connecting to a local hecate server
./cli.js --url 'http://localhost:8000'
```

</details>

<h2 align=center>API Documentation</h2>

The [API documentation](/docs/api.md) can be found in the `docs/API.md` file. This file is automatically
generated from the internal JSDocs.
