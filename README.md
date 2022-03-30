# vc-sl-sdk-js

## Overview

Support for the Verifiable Credential Status List on the Hedera File Service JavaScript/TypeScript SDK.

This repository contains the SDK for managing [Verifiable Credential Status List 2021](https://w3c-ccg.github.io/vc-status-list-2021) using the [Hedera File Service](https://docs.hedera.com/guides/docs/sdks/file-storage).

## Usage

```sh
npm install --save @hashgraph/vc-sl-sdk-js
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

## Configuration

Following examples use accountId as `OPERATOR_ID` and privateKey string value as `OPERATOR_KEY` & `VC_STATUS_LIST_OWNER_PRIVATE_KEY` to submit VC Status List to [Hedera File Service](https://docs.hedera.com/guides/docs/sdks/file-storage).

## Run Examples

Sample demo step by step javascript example are available at [Demo Folder](https://github.com/Meeco/vc-sdk-js/tree/main/demo). Make sure to add appropriate `testnet` account details in <b>`.env.json`</b>

```json
{
    "OPERATOR_ID": "0.0...",
    "OPERATOR_KEY": "302e0201.."
}
```

### Setup 1

```sh
npm install
node demo/1_create_vc_status_list.js 
```

After running first step of the demo flow use printed out `VC_STATUS_LIST_FILE_ID` & `VC_STATUS_LIST_OWNER_PRIVATE_KEY` values to complete the <b>`.env.json`</b> configuration file.

```json
{
...
...
"VC_STATUS_LIST_FILE_ID": "0.0...",
"VC_STATUS_LIST_OWNER_PRIVATE_KEY": "302e0201.."
}
```

That's it! You are set to execute other demo flows.

```sh
node demo/2_change_vc_status_to_ACTIVE.js
node demo/3_resolve_vc_status.js
node demo/4_change_vc_status_to_REVOKED.js
node demo/5_change_vc_status_to_SUSPENDED.js
node demo/6_change_vc_status_to_RESUMED.js
node demo/3_resolve_vc_status.js
```

## Development

```sh
git clone git@github.com:hashgraph/vc-sl-sdk-js.git
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

Run Test

Open `jest.setup.js` file and update the following environment variables with your `testnet` account details

```javascript
process.env.OPERATOR_ID = "0.0...";
process.env.OPERATOR_KEY = "302e0201..";
```

```sh
npm run test
```

## References

- <https://w3c-ccg.github.io/vc-status-list-2021/>
- <https://docs.hedera.com/guides/docs/sdks/file-storage>
- <https://docs.hedera.com/hedera-api/>
- <https://www.hedera.com/>

## License Information

Licensed under _license placeholder_.
