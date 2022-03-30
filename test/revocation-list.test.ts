import { PrivateKey, Client, FileContentsQuery } from "@hashgraph/sdk";
import { HfsVcSl, VcSlStatus } from "../dist";

describe("HfsVcSl", () => {
    let hfsVcSl;
    let client;
    let fileId;

    beforeAll(async () => {
        client = Client.forTestnet();
        client.setOperator(process.env.OPERATOR_ID, process.env.OPERATOR_KEY);
        const revocationListOwnerPrivateKey = PrivateKey.generate();

        hfsVcSl = new HfsVcSl(client, revocationListOwnerPrivateKey);
        fileId = await hfsVcSl.createRevocationListFile();
    });

    describe("revocation list", () => {
        describe("#createRevocationListFile", () => {
            it("creates a file on Hedera file services", async () => {
                const query = new FileContentsQuery().setFileId(fileId);
                const encodedStatusList = await query.execute(client);
                expect(encodedStatusList.toString()).toEqual(
                    "H4sIAAAAAAAAA-3BMQEAAADCoPVPbQsvoAAAAAAAAAAAAAAAAP4GcwM92tQwAAA"
                );
            });
        });

        describe("#CredentialStatus", () => {
            it("should apply revoke status to revocation list index 0", async () => {
                const test = await hfsVcSl.revokeByIndex(fileId, 0);
                const status = await hfsVcSl.resolveStatusByIndex(fileId, 0);
                expect(VcSlStatus[status]).toEqual(VcSlStatus.REVOKED);
            });

            it("should apply suspend status to revocation list index 0", async () => {
                await hfsVcSl.suspendByIndex(fileId, 0);
                const status = await hfsVcSl.resolveStatusByIndex(fileId, 0);
                expect(VcSlStatus[status]).toEqual(VcSlStatus.SUSPENDED);
            });

            it("should apply resume status to revocation list index 0", async () => {
                await hfsVcSl.resumeByIndex(fileId, 0);
                const status = await hfsVcSl.resolveStatusByIndex(fileId, 0);
                expect(VcSlStatus[status]).toEqual(VcSlStatus.RESUMED);
            });

            it("should apply issue status to revocation list index 0", async () => {
                await hfsVcSl.issueByIndex(fileId, 0);
                const status = await hfsVcSl.resolveStatusByIndex(fileId, 0);
                expect(VcSlStatus[status]).toEqual(VcSlStatus.ACTIVE);
            });
        });
    });
});
