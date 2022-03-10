const { PrivateKey, Client, FileId } = require("@hashgraph/sdk");
const { HcsVc } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY, REVOCATION_LIST_FILE_ID, ISSUER_DID, ISSUER_PK, TOPIC_ID } = require("./.env.json");

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

    const revocationListFileId = FileId.fromString(REVOCATION_LIST_FILE_ID);

    const updatedList = await hcsVc.revokeByIndex(revocationListFileId, 0);

    console.log("==== list ====");
    console.log(updatedList);
}

main();
