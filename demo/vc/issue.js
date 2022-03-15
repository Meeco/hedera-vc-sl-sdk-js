const { PrivateKey } = require("@hashgraph/sdk");
const { VC } = require("../../script/dist");
const { ISSUER_DID, ISSUER_PK, SUBJECT_DID } = require("./.env.json");

async function main() {
    const verifiableCredential = new VC(ISSUER_DID, PrivateKey.fromString(ISSUER_PK));

    let vc = await verifiableCredential.issue({
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
        credentialStatus: {
            id: "https://dmv.example.gov/credentials/status/3#1",
            revocationListCredential: "https://example.com/credentials/status/0.0.30965584",
            revocationListIndex: 1,
            type: "RevocationList2020Status",
        },
    });

    console.log(vc);
}

main();
