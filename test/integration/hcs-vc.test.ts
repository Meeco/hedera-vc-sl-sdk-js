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
const SUBJECT_DID = process.env.SUBJECT_DID;

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
        hcsVc = new HcsVc(ISSUER_DID, PrivateKey.fromString(ISSUER_PK), TOPIC_ID, operatorKey, client);
    });

    describe("#issue", () => {
        it("creates new verifiable credential for issuer", async () => {
            // create VC
            const credential = await hcsVc.issue({
                credentialSubject: {
                    id: SUBJECT_DID,
                    givenName: "Jane",
                    familyName: "Doe",
                    degree: {
                        type: "BachelorDegree",
                        name: "Bachelor of Science and Arts",
                        college: "College of Engineering",
                    },
                },
                credentialSchema: {
                    id: "https://example.org/examples/degree.json",
                    type: "JsonSchemaValidator2018",
                },
                expiration: new Date("2022-01-01T00:00:00Z"),
                evidence: [
                    {
                        id: "https://example.edu/evidence/f2aeec97-fc0d-42bf-8ca7-0548192d4231",
                        type: ["DocumentVerification"],
                        verifier: "https://example.edu/issuers/14",
                        evidenceDocument: "DriversLicense",
                        subjectPresence: "Physical",
                        documentPresence: "Physical",
                        licenseNumber: "123AB4567",
                    },
                ],
            });
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
