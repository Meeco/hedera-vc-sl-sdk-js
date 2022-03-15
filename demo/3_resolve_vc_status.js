const { PrivateKey, Client, FileId } = require("@hashgraph/sdk");
const { HfsVcSl } = require("../dist");
const {
    OPERATOR_ID,
    OPERATOR_KEY,
    REVOCATION_LIST_OWNER_PRIVATE_KEY,
    REVOCATION_LIST_FILE_ID,
} = require("./.env.json");

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    const hfsVc = new HfsVcSl(
        PrivateKey.fromString(OPERATOR_KEY), // this is to sign transaction
        client,
        PrivateKey.fromString(REVOCATION_LIST_OWNER_PRIVATE_KEY)
    );

    const revocationListFileId = FileId.fromString(REVOCATION_LIST_FILE_ID);

    console.log("==== status ====");
    console.log(await hfsVc.resolveStatusByIndex(revocationListFileId, 0));

    console.log("==== list ====");
    console.log(await hfsVc.loadRevocationList(revocationListFileId));
}

main();
