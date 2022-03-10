import { AccountId, Client, FileContentsQuery, PrivateKey } from "@hashgraph/sdk";
import { HcsVc } from "../../src";

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
        hcsVc = new HcsVc(
            ISSUER_DID,
            PrivateKey.fromString(ISSUER_PK), // this is to sign message
            TOPIC_ID,
            PrivateKey.fromString(OPERATOR_KEY), // this is to sign transaction
            client
        );
    });

    describe("revocation list", () => {
        describe("#createRevocationListFile", () => {
            it("creates a file on Hedera file services", async () => {
                const fileId = await hcsVc.createRevocationListFile();

                const query = new FileContentsQuery().setFileId(fileId);
                const encodedStatusList = await query.execute(client);
                expect(encodedStatusList.toString()).toEqual(
                    "H4sIAAAAAAAAA-3BMQEAAADCoPVPbQsvoAAAAAAAAAAAAAAAAP4GcwM92tQwAAA"
                );
            });
        });

        xdescribe("#loadRevocationList", () => {
            it("loads and decodes previously created file from Hedera services", async () => {
                const fileId = await hcsVc.createRevocationListFile();
                const decodedFile = await hcsVc.loadRevocationList(fileId);
                expect(decodedFile).toBeInstanceOf("RevocationList");
            });
        });
    });

    describe("credential", () => {
        let revocationListFileId;

        beforeAll(async () => {
            revocationListFileId = await hcsVc.createRevocationListFile();
        });

        describe("#issue", () => {
            it("creates new verifiable credential for issuer", async () => {
                // create VC
                const credential = await hcsVc.issue(
                    {
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
                    },
                    revocationListFileId,
                    0
                );

                expect(credential).toBeDefined();
                expect(credential.issuanceDate).toBeDefined();
                expect(credential.type).toEqual(["VerifiableCredential"]);
                expect(credential.issuer.id).toEqual(ISSUER_DID);
                expect(credential["@context"]).toBeDefined();
                expect(credential.expirationDate).toEqual("2022-01-01T00:00:00.000Z");
                expect(credential.proof).toBeDefined();
                expect(credential.proof.type).toEqual("Ed25519Signature2018");
                expect(credential.proof.proofPurpose).toEqual("assertionMethod");
                expect(credential.proof.jws).toBeDefined();
                expect(credential.proof.verificationMethod).toEqual(ISSUER_DID + "#did-root-key");
                expect(credential.proof.created).toBeDefined();
                expect(credential.credentialStatus).toBeDefined();
                expect(credential.credentialStatus.type).toEqual("RevocationList2020Status");
                expect(credential.credentialStatus.revocationListIndex).toEqual(0);
            });
        });
    });
});
