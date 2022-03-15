const { PrivateKey, Client, FileContentsQuery } = require("@hashgraph/sdk");
const { HfsVcSl, VcSlStatuses } = require("../../dist");
const { OPERATOR_ID, OPERATOR_KEY } = require("../.env.json");

describe("HfsVcSl", () => {
    let hfsVcSl;
    let client;
    let fileId;

    before(async () => {
        client = Client.forTestnet();
        client.setOperator(OPERATOR_ID, OPERATOR_KEY);
        const revocationListOwnerPrivateKey = PrivateKey.generate();

        hfsVcSl = new HfsVcSl(
            PrivateKey.fromString(OPERATOR_KEY), // this is to sign transaction
            client,
            revocationListOwnerPrivateKey
        );
        fileId = await hfsVcSl.createRevocationListFile();
    });

    describe("revocation list", () => {
        describe("#createRevocationListFile", () => {
            it("creates a file on Hedera file services", async () => {
                const query = new FileContentsQuery().setFileId(fileId);
                const encodedStatusList = await query.execute(client);
                assert.equal(
                    encodedStatusList.toString(),
                    "H4sIAAAAAAAAA-3BMQEAAADCoPVPbQsvoAAAAAAAAAAAAAAAAP4GcwM92tQwAAA"
                );
            });
        });

        describe("#CredentialStatus", () => {
            it("should apply revoke status to revocation list index 0", async () => {
                await hfsVcSl.revokeByIndex(fileId, 0);
                const status = await hfsVcSl.resolveStatusByIndex(fileId, 0);
                assert.equal(VcSlStatuses[status], VcSlStatuses.REVOKE);
            });

            it("should apply suspend status to revocation list index 0", async () => {
                await hfsVcSl.suspendByIndex(fileId, 0);
                const status = await hfsVcSl.resolveStatusByIndex(fileId, 0);
                assert.equal(VcSlStatuses[status], VcSlStatuses.SUSPENDED);
            });

            it("should apply resume status to revocation list index 0", async () => {
                await hfsVcSl.resumeByIndex(fileId, 0);
                const status = await hfsVcSl.resolveStatusByIndex(fileId, 0);
                assert.equal(VcSlStatuses[status], VcSlStatuses.RESUME);
            });

            it("should apply issue status to revocation list index 0", async () => {
                await hfsVcSl.issueByIndex(fileId, 0);
                const status = await hfsVcSl.resolveStatusByIndex(fileId, 0);
                assert.equal(VcSlStatuses[status], VcStatus.ACTIVE);
            });
        });
    });
});
