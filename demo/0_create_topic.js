const { TopicCreateTransaction, Client } = require("@hashgraph/sdk");
const { OPERATOR_ID, OPERATOR_KEY } = require("./.env.json");

async function main() {
    const client = Client.forTestnet();
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    //Create the transaction
    const transaction = new TopicCreateTransaction();

    //Sign with the client operator private key and submit the transaction to a Hedera network
    const txResponse = await transaction.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the topic ID
    const newTopicId = receipt.topicId;

    console.log("The new topic ID is " + newTopicId);
}

main();
