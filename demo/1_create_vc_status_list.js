const { PrivateKey, Client } = require("@hashgraph/sdk");
const { HfsVcSl } = require("../dist");
const { OPERATOR_ID, OPERATOR_KEY } = require("./.env.json");

async function main() {
    /**
     * Client setup
     */
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    const VC_STATUS_LIST_OWNER_PRIVATE_KEY = PrivateKey.generate();

    const hfsVc = new HfsVcSl(client, VC_STATUS_LIST_OWNER_PRIVATE_KEY);

    const VC_STATUS_LIST_FILE_ID = await hfsVc.createStatusListFile();

    console.log(`VC_STATUS_LIST_FILE_ID: ${VC_STATUS_LIST_FILE_ID.toString()}`);
    console.log(`VC_STATUS_LIST_OWNER_PRIVATE_KEY: ${VC_STATUS_LIST_OWNER_PRIVATE_KEY.toString()}`);
    console.log(await hfsVc.loadStatusList(VC_STATUS_LIST_FILE_ID));
}

main();
