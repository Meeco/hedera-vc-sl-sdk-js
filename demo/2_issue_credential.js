const { PrivateKey, Client, FileId } = require("@hashgraph/sdk");
const { HcsVc } = require("../dist");
const {
    OPERATOR_ID,
    OPERATOR_KEY,
    SUBJECT_DID,
    REVOCATION_LIST_FILE_ID,
    ISSUER_DID,
    ISSUER_PK,
    TOPIC_ID,
} = require("./.env.json");

const revocationListFileId = FileId.fromString(REVOCATION_LIST_FILE_ID);

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    const hcsVc = new HcsVc(
        ISSUER_DID,
        PrivateKey.fromString(ISSUER_PK), // this is to sign message
        TOPIC_ID,
        PrivateKey.fromString(OPERATOR_KEY), // this is to sign transaction
        client
    );

    /**
     *  Issue cred
     */
    let vc = await hcsVc.issue(
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

    console.log(vc);
}

main();
