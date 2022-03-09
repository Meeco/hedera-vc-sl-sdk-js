const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsVc } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY, SUBJECT_DID, ISSUER_DID, ISSUER_PK, TOPIC_ID } = require("./.env.json");
var fs = require("fs");

const rl = require("vc-revocation-list");

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

    // const list = await rl.createList({ length: 100000 });
    // const encodedList = await list.encode();

    // fs.open("./demo/file.txt", "r", function (status, fd) {
    //     fs.writeFileSync("./demo/file.txt", encodedList);

    //     var buffer = Buffer.alloc(100);
    //     fs.read(fd, buffer, 0, 100, 0, function (err, num) {
    //         console.log(buffer.toString("utf8", 0, num));
    //     });
    // });

    /**
     *  Issue cred
     */
    let vc = await hcsVc.issue({
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

    // create cred - singed by issuer pk
    // create hash
    // create message
    //{
    //     "mode": "plain",
    //     "message": {
    //         "operation": "issue",
    //         "credentialHash": "BSgRkqRSCZwZJrgWtbsTvZG7s93zBYYxP2Dtqwm25ajb",
    //         "timestamp": "2022-03-04T02:47:18.192323Z"
    //     },
    //     "signature": "uw1Bl7ARRm27ZjhG+9aYRJ+N6zmzvZOI10koz6T6gSS5GJAci9OTnYyL2LVJgGilx1hAHCL2A3nkQ6AU6eNPCw=="
    // }
    // submit transaction
    // output : W3C Cred signed by issuer and subject as did -  "credentialHash": "7L6ZqXZzusWvMfzRCTrzjan2AgPFotQzfWqdzXwVNHkV"

    // const registeredDid = await vc.issue();

    //get status - ACTIVE, REVOKE, SU.....
    // const status = await vc.verifyStatus();

    // find out vc hash
    // create message
    // create message
    //{
    //     "mode": "plain",
    //     "message": {
    //         "operation": "revoke",
    //         "credentialHash": "BSgRkqRSCZwZJrgWtbsTvZG7s93zBYYxP2Dtqwm25ajb",
    //         "timestamp": "2022-03-04T02:47:18.192323Z"
    //     },
    //     "signature": "uw1Bl7ARRm27ZjhG+9aYRJ+N6zmzvZOI10koz6T6gSS5GJAci9OTnYyL2LVJgGilx1hAHCL2A3nkQ6AU6eNPCw=="
    // }
    // submit transaction
    // status
    // const revoke = await vc.revoke();

    console.log("\n ======= VC ======== \n");
    console.log(vc);

    console.log("hash" + vc.hash());
}

main();
