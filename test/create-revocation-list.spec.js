/*!
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
const { PrivateKey, Client, FileContentsQuery } = require("@hashgraph/sdk");
const { HcsVc } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY, ISSUER_DID, ISSUER_PK, TOPIC_ID } = require("./.env.json");
const { assert } = require("chai");

describe("HcsVc", () => {
    describe("revocation list", () => {
        describe("#createRevocationListFile", () => {
            it("creates a file on Hedera file services", async () => {
                let hcsVc;
                let client;
                client = Client.forTestnet();
                client.setOperator(OPERATOR_ID, OPERATOR_KEY);

                hcsVc = new HcsVc(
                    ISSUER_DID,
                    PrivateKey.fromString(ISSUER_PK), // this is to sign message
                    TOPIC_ID,
                    PrivateKey.fromString(OPERATOR_KEY), // this is to sign transaction
                    client
                );

                const fileId = await hcsVc.createRevocationListFile();

                const query = new FileContentsQuery().setFileId(fileId);
                const encodedStatusList = await query.execute(client);
                assert.equal(
                    encodedStatusList.toString(),
                    "H4sIAAAAAAAAA-3BMQEAAADCoPVPbQsvoAAAAAAAAAAAAAAAAP4GcwM92tQwAAA"
                );
            });
        });
    });
});
