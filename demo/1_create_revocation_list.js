const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HcsRl } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY, REVOCATION_LIST_OWNER_PRIVATE_KEY } = require("./.env.json");

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    const hcsVc = new HcsRl(
        PrivateKey.fromString(OPERATOR_KEY), // this is to sign transaction
        client,
        PrivateKey.fromString(REVOCATION_LIST_OWNER_PRIVATE_KEY)
    );

    const revocationListFileId = await hcsVc.createRevocationListFile();

    console.log(`File ID: ${revocationListFileId.toString()}`);
    console.log(await hcsVc.loadRevocationList(revocationListFileId));
}

main();
