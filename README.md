# vc-sdk-js

## Overview

## Usage

```sh
npm install --save @hashgraph/vc-sdk-js
```

## Setup Hedera Portal Account

- Register hedera portal Testnet account <https://portal.hedera.com/register>
- Login to portal <https://portal.hedera.com/?network=testnet>
- Obtain accountId & privateKey string value.

```json
"operator": {
  "accountId": "0.0.xxxx",
  "publicKey": "...",
  "privateKey": "302.."
}
```

- Following examples use accountId as `OPERATOR_ID` and privateKey string value as `OPERATOR_KEY` to submit DID Event Messages to HCS.

## Examples

Sample demo step by step javascript example are available at [Demo Folder][demo-location]. Make sure to add appropriate `testnet` account details in <b>`.env.json`</b>

- OPERATOR_ID=0.0.xxxx
- OPERATOR_KEY=302...

After running first step of the demo flow use printed out values to complete the <b>`.env.json`</b> configuration file.

- DID_IDENTIFIER=did:hedera:testnet:..._0.0.xxx
- DID_PRIVATE_KEY=302...

That's it! You are set to execute other demo flows.

```javascript
const OPERATOR_ID=0.0.xxxx;
const PRIVATE_KEY_STR=302...;


## Development

```sh
git clone git@github.com:hashgraph/vc-sdk-js.git
```

First, you need to install dependencies and build the project

```sh
npm install
```

Run build in dev mode (with sourcemap generation and following changes)

```sh
npm run build:dev
```

## Tests

Run Unit Tests

```sh
npm run test:unit
```

Run Integration Test

Open jest.setup.js file and update the following environment variables with your `testnet` account details

```js
process.env.OPERATOR_ID = "0.0.xxxxxx";
process.env.OPERATOR_KEY = "302e02...";
```

```sh
npm run test:integration
```

## References

- <https://github.com/hashgraph/did-method>
- <https://github.com/hashgraph/hedera-sdk-js>
- <https://docs.hedera.com/hedera-api/>
- <https://www.hedera.com/>
- <https://www.w3.org/TR/did-core/>
- <https://www.w3.org/TR/vc-data-model/>

## License Information

Licensed under _license placeholder_.
