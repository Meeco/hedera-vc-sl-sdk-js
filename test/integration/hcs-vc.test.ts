import { AccountId, Client, PrivateKey, Timestamp, TopicMessageQuery } from "@hashgraph/sdk";
import { decodeJWT } from "did-jwt";
import { HcsVc } from "../../src";
import { VCJWT } from "../../src/identity/hcs/vc/hcs-vc";

const TOPIC_REGEXP = /^0\.0\.[0-9]{8,}/;

const OPERATOR_ID = process.env.OPERATOR_ID;
const OPERATOR_KEY = process.env.OPERATOR_KEY;
const TOPIC_ID = process.env.TOPIC_ID;
const ISSUER_DID = process.env.ISSUER_DID;
const ISSUER_PK = process.env.ISSUER_PK;

// testnet, previewnet, mainnet
const NETWORK = "testnet";

// hedera
const MIRROR_PROVIDER = ["hcs." + NETWORK + ".mirrornode.hedera.com:5600"];

describe("HcsVc", () => {
    let client;
    let hcsVc;

    beforeAll(async () => {
        const operatorId = AccountId.fromString(OPERATOR_ID);
        const operatorKey = PrivateKey.fromString(OPERATOR_KEY);
        client = Client.forTestnet();
        client.setMirrorNetwork(MIRROR_PROVIDER);
        client.setOperator(operatorId, operatorKey);
        hcsVc = new HcsVc(ISSUER_DID, PrivateKey.fromString(ISSUER_PK));
    });

    describe("#issue", () => {
        it("creates new verifiable credential for issuer", async () => {
            // create VC
            let vc = await hcsVc.issue({
                credentialSchema: {
                    id: "license",
                    type: "JsonSchemaValidator2018",
                },
                credentialSubject: {
                    id: "did:of:license:owner:123",
                    DriversLicence: {
                        id: "urn:meeco:driverlicenceCredID",
                        birthDate: "01/02/1980",
                    },
                },
                expiration: new Date("2022-01-01T00:00:00Z"),
                evidence: {
                    id: "1234",
                    validatedBy: "Jim",
                },
            });

            // create hash
            // submit hash to hcs
        });

        it("register signed credential hash message to hcs", async () => {});
    });
});

/**
 * Test Helpers
 */

async function readTopicMessages(topicId, client, timeout = null) {
    const messages = [];

    new TopicMessageQuery()
        .setTopicId(topicId)
        .setStartTime(new Timestamp(0, 0))
        .setEndTime(Timestamp.fromDate(new Date()))
        .subscribe(client, null, (msg) => {
            messages.push(msg);
        });

    /**
     * wait for READ_MESSAGES_TIMEOUT seconds and assume all messages were read
     */
    await new Promise((resolve) => setTimeout(resolve, timeout || 6000));

    return messages;
}
