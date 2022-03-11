/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsVc } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY, ISSUER_DID, ISSUER_PK, TOPIC_ID } = require("./.env.json");

describe("RevocationList", () => {
    it("should create an instance", async () => {
        const client = Client.forTestnet();
        client.setOperator(OPERATOR_ID, OPERATOR_KEY);

        const hcsVc = new HcsVc(
            ISSUER_DID,
            PrivateKey.fromString(ISSUER_PK), // this is to sign message
            TOPIC_ID,
            PrivateKey.fromString(OPERATOR_KEY), // this is to sign transaction
            client
        );

        const revocationListFileId = await hcsVc.createRevocationListFile();

        console.log(`File ID: ${revocationListFileId.toString()}`);
        console.log(await hcsVc.loadRevocationList(revocationListFileId));
    });
});
