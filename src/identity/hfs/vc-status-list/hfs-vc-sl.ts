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
    public static REVOCATION_LIST_LENGTH = 100000;

    public static TRANSACTION_FEE = new Hbar(2);
    public static READ_TOPIC_MESSAGES_TIMEOUT = 5000;

    /**
     * Public API
     */

    constructor(
        protected accountPrivateKey: PrivateKey,
        protected client: Client,
        protected revocationListOwnerPrivateKey: PrivateKey
    ) {}

    async createRevocationListFile() {
        const revocationList = await rl.createList({ length: HfsVcSl.REVOCATION_LIST_LENGTH });
        const encodedEevocationList = await revocationList.encode();

        const transaction = await new FileCreateTransaction()
            .setKeys([this.revocationListOwnerPrivateKey.publicKey])
            .setContents(encodedEevocationList)
            .setMaxTransactionFee(new Hbar(2))
            .freezeWith(this.client);

        const signTx = await transaction.sign(this.revocationListOwnerPrivateKey);
        const submitTx = await signTx.execute(this.client);
        const receipt = await submitTx.getReceipt(this.client);

        return receipt.fileId;
    }

    async loadRevocationList(revocationListFileId: FileId) {
        const query = new FileContentsQuery().setFileId(revocationListFileId);
        const encodedStatusList = await query.execute(this.client);
        const decodedStatusList = await rl.decodeList({ encodedList: encodedStatusList.toString() });

        return decodedStatusList;
    }

    async revokeByIndex(revocationListFileId: FileId, revocationListIndex: number) {
        return this.updateStatus(revocationListFileId, revocationListIndex, VcSlStatus.REVOKED);
    }

    async issueByIndex(revocationListFileId: FileId, revocationListIndex: number) {
        return this.updateStatus(revocationListFileId, revocationListIndex, VcSlStatus.ACTIVE);
    }

    async resolveStatusByIndex(revocationListFileId: FileId, revocationListIndex: number): Promise<string> {
        const revocationListDecoded = await this.loadRevocationList(revocationListFileId);

        // set the bits
        const firstBit = Number(revocationListDecoded.isRevoked(revocationListIndex)).toString();
        const secondBit = Number(revocationListDecoded.isRevoked(revocationListIndex + 1)).toString();

        return VcSlStatus[parseInt(`${firstBit}${secondBit}`, 2)];
    }

    async suspendByIndex(revocationListFileId: FileId, revocationListIndex: number) {
        return this.updateStatus(revocationListFileId, revocationListIndex, VcSlStatus.SUSPENDED);
    }

    async resumeByIndex(revocationListFileId: FileId, revocationListIndex: number) {
        return this.updateStatus(revocationListFileId, revocationListIndex, VcSlStatus.RESUMED);
    }

    async updateStatus(revocationListFileId: FileId, revocationListIndex: number, status: VcSlStatus) {
        const revocationListDecoded = await this.loadRevocationList(revocationListFileId);

        // set the bits
        let binary = status.toString(2);
        binary = binary.length == 1 ? `0${binary}` : binary;
        binary
            .split("")
            .forEach((b, index) => revocationListDecoded.setRevoked(revocationListIndex + index, Boolean(parseInt(b))));

        const revocationListEncoded = await revocationListDecoded.encode();

        const transaction = await new FileUpdateTransaction()
            .setFileId(revocationListFileId)
            .setContents(revocationListEncoded)
            .setMaxTransactionFee(new Hbar(2))
            .freezeWith(this.client);

        const signTx = await transaction.sign(this.revocationListOwnerPrivateKey);
        const submitTx = await signTx.execute(this.client);
        await submitTx.getReceipt(this.client);

        return revocationListDecoded;
    }
}
