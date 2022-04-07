import {
    Client,
    FileContentsQuery,
    FileCreateTransaction,
    FileId,
    FileUpdateTransaction,
    Hbar,
    PrivateKey,
} from "@hashgraph/sdk";
import * as rl from "vc-revocation-list";
import { VcSlStatus } from "./vc-sl-status";

export class HfsVcSl {
    public static VC_STATUS_LIST_LENGTH = 100032;

    public static TRANSACTION_FEE = new Hbar(2);

    /**
     * Public API
     */

    constructor(protected client: Client, protected vcStatusListOwnerPrivateKey: PrivateKey) {}

    async createRevocationListFile() {
        const vcStatusList = await rl.createList({ length: HfsVcSl.VC_STATUS_LIST_LENGTH });
        const encodedVcStatusList = await vcStatusList.encode();

        const transaction = await new FileCreateTransaction()
            .setKeys([this.vcStatusListOwnerPrivateKey.publicKey])
            .setContents(encodedVcStatusList)
            .setMaxTransactionFee(HfsVcSl.TRANSACTION_FEE)
            .freezeWith(this.client);

        const signTx = await transaction.sign(this.vcStatusListOwnerPrivateKey);
        const submitTx = await signTx.execute(this.client);
        const receipt = await submitTx.getReceipt(this.client);

        return receipt.fileId;
    }

    async loadRevocationList(vcStatusListFileId: FileId) {
        const query = new FileContentsQuery().setFileId(vcStatusListFileId);
        const encodedStatusList = await query.execute(this.client);
        const decodedStatusList = await rl.decodeList({ encodedList: encodedStatusList.toString() });

        return decodedStatusList;
    }

    async revokeByIndex(vcStatusListFileId: FileId, vcStatusListIndex: number) {
        return this.updateStatus(vcStatusListFileId, vcStatusListIndex, VcSlStatus.REVOKED);
    }

    async issueByIndex(vcStatusListFileId: FileId, vcStatusListIndex: number) {
        return this.updateStatus(vcStatusListFileId, vcStatusListIndex, VcSlStatus.ACTIVE);
    }

    async resolveStatusByIndex(vcStatusListFileId: FileId, vcStatusListIndex: number): Promise<string> {
        const vcStatusListDecoded = await this.loadRevocationList(vcStatusListFileId);

        // set the bits
        const firstBit = Number(vcStatusListDecoded.isRevoked(vcStatusListIndex)).toString();
        const secondBit = Number(vcStatusListDecoded.isRevoked(vcStatusListIndex + 1)).toString();

        return VcSlStatus[parseInt(`${firstBit}${secondBit}`, 2)];
    }

    async suspendByIndex(vcStatusListFileId: FileId, vcStatusListIndex: number) {
        return this.updateStatus(vcStatusListFileId, vcStatusListIndex, VcSlStatus.SUSPENDED);
    }

    async resumeByIndex(vcStatusListFileId: FileId, vcStatusListIndex: number) {
        return this.updateStatus(vcStatusListFileId, vcStatusListIndex, VcSlStatus.RESUMED);
    }

    async updateStatus(vcStatusListFileId: FileId, vcStatusListIndex: number, status: VcSlStatus) {
        if (vcStatusListIndex !== 0 && vcStatusListIndex % 2 !== 0) {
            throw new Error("vcStatusListIndex must be Multiples of 2 OR 0. e.g. 0, 2, 4, 6, 8, 10, 12, 14");
        }

        const vcStatusListDecoded = await this.loadRevocationList(vcStatusListFileId);

        // set the bits
        let binary = status.toString(2);
        binary = binary.length == 1 ? `0${binary}` : binary;
        binary
            .split("")
            .forEach((b, index) => vcStatusListDecoded.setRevoked(vcStatusListIndex + index, Boolean(parseInt(b))));

        const vcStatusListEncoded = await vcStatusListDecoded.encode();

        const transaction = await new FileUpdateTransaction()
            .setFileId(vcStatusListFileId)
            .setContents(vcStatusListEncoded)
            .setMaxTransactionFee(HfsVcSl.TRANSACTION_FEE)
            .freezeWith(this.client);

        const signTx = await transaction.sign(this.vcStatusListOwnerPrivateKey);
        const submitTx = await signTx.execute(this.client);
        await submitTx.getReceipt(this.client);

        return vcStatusListDecoded;
    }
}
