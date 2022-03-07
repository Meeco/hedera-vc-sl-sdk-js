const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsVc, Issuer } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY, TOPIC_ID } = require("./.env.json");

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    const issuerPrivateKey = PrivateKey.generate();
    const issuer = new Issuer(issuerDID, "Test Issuer");

    /**
     *  Issue cred
     *
     */
    const claims = {
        name: "Melbourne Uni",
        address: "Melbourne",
        code: "12345",
        course: {
            id: "122345",
            courseCode: "ws101",
            name: "WorkSafe Basic Training Module",
            version: "2021-01-01",
            provider: "WorkPro Training",
        },
    };

    const vc = new HcsVc({
        issuer: issuer,
        subjectDID: subjectDID,
        client: client,
        type: "cert ",
        claims: claims,
        expiryDate: _date,
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

    const registeredDid = await vc.issue();

    //get status - ACTIVE, REVOKE, SU.....
    const status = await vc.verifyStatus();

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
    const revoke = await vc.revoke();

    console.log("\n");
    console.log(`DID PRIVATE KEY: ${didPrivateKey.toString()}`);
    console.log(`DID PUBLIC KEY: ${didPrivateKey.publicKey.toString()}`);
    console.log(registeredDid.getIdentifier());
}

main();
