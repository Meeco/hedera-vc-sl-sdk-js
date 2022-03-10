import {
    Client,
    FileContentsQuery,
    FileCreateTransaction,
    FileId,
    FileUpdateTransaction,
    Hbar,
    PrivateKey,
    TopicId,
} from "@hashgraph/sdk";
import * as vc from "did-jwt-vc";
import { Issuer } from "did-jwt-vc";
import * as u8a from "uint8arrays";
import { createList, decodeList } from "vc-revocation-list";
import { VcStatus } from "../../vc-status";
import { W3CCredential } from "./w3c-credential";

export type VCJWT = string;

export class HcsVc {
    public static REVOCATION_LIST_LENGTH = 100000;

    public static TRANSACTION_FEE = new Hbar(2);
    public static READ_TOPIC_MESSAGES_TIMEOUT = 5000;

    /**
     * TODO: Development code
     */
    public static TEST_FILE_KEY = PrivateKey.fromString(
        "302e020100300506032b6570042204204c657138981d342db74776ffd80cf724eb6a04a8c98a5738f0414472ec104f82"
    );

    /**
     * Public API
     */

    protected _issuer: vc.Issuer;
    protected _topicId: TopicId;

    constructor(
        protected issuerDID: string,
        protected issuerPrivateKey: PrivateKey,
        protected topicId: string,
        protected accountPrivateKey: PrivateKey,
        protected client: Client
    ) {
        // signs with EdDSA/Ed2219
        this._issuer = this.createSigner(this.issuerPrivateKey, this.issuerDID);
        this._topicId = TopicId.fromString(topicId);
    }

    get signer() {
        return this._issuer;
    }

    async createRevocationListFile() {
        const revocationList = await createList({ length: HcsVc.REVOCATION_LIST_LENGTH });
        const encodedEevocationList = await revocationList.encode();

        const transaction = await new FileCreateTransaction()
            .setKeys([HcsVc.TEST_FILE_KEY.publicKey])
            .setContents(encodedEevocationList)
            .setMaxTransactionFee(new Hbar(2))
            .freezeWith(this.client);

        const signTx = await transaction.sign(HcsVc.TEST_FILE_KEY);
        const submitTx = await signTx.execute(this.client);
        const receipt = await submitTx.getReceipt(this.client);

        return receipt.fileId;
    }

    async loadRevocationList(revocationListFileId: FileId) {
        const query = new FileContentsQuery().setFileId(revocationListFileId);
        const encodedStatusList = await query.execute(this.client);
        const decodedStatusList = await decodeList({ encodedList: encodedStatusList.toString() });

        return decodedStatusList;
    }

    async issue(
        args: {
            credentialSubject: any;
            expiration: Date;
            contexts?: string[];
            evidence?: any;
            credentialSchema: { id: string; type: string } | Array<{ id: string; type: string }>;
        },
        revocationListFileId: FileId,
        revocationListIndex: number
    ) {
        if (!revocationListFileId) {
            throw new Error("revocationListFileId param is missing");
        }

        if (typeof revocationListIndex !== "number" || revocationListIndex < 0) {
            throw new Error("Invalid revocationListIndex param");
        }

        try {
            args["credentialStatus"] = {
                id: `https://dmv.example.gov/credentials/status/3#${revocationListIndex}`,
                type: "RevocationList2020Status",
                revocationListIndex: revocationListIndex,
                revocationListCredential: `https://example.com/credentials/status/${revocationListFileId.toString()}`,
            };

            const credential = await W3CCredential.create(args, this._issuer);
            return credential;
        } catch (err) {
            console.error(err);
        }
    }

    async revokeByIndex(revocationListFileId: FileId, revocationListIndex: number) {
        return this.updateStatus(revocationListFileId, revocationListIndex, VcStatus.REVOKE);
    }

    async resolveStatusByIndex(revocationListFileId: FileId, revocationListIndex: number): Promise<string> {
        const revocationListDecoded = await this.loadRevocationList(revocationListFileId);

        // set the bits
        const firstBit = Number(revocationListDecoded.isRevoked(revocationListIndex)).toString();
        const secondBit = Number(revocationListDecoded.isRevoked(revocationListIndex + 1)).toString();

        return VcStatus[parseInt(firstBit + secondBit, 2)];
    }

    async suspendByIndex(revocationListFileId: FileId, revocationListIndex: number) {
        return this.updateStatus(revocationListFileId, revocationListIndex, VcStatus.SUSPENDED);
    }

    async resumeByIndex(revocationListFileId: FileId, revocationListIndex: number) {
        return this.updateStatus(revocationListFileId, revocationListIndex, VcStatus.RESUME);
    }

    async updateStatus(revocationListFileId: FileId, revocationListIndex: number, status: VcStatus) {
        const revocationListDecoded = await this.loadRevocationList(revocationListFileId);

        // set the bits
        let binary = status.toString(2);
        binary = binary.length == 1 ? `0${binary}` : binary;
        binary.split("").forEach(
            (b, index) => revocationListDecoded.setRevoked(revocationListIndex + index, Boolean(parseInt(b)))
            //console.log(`revocationListDecoded.setRevoked(${revocationListIndex + index}, ${Boolean(parseInt(b))})`)
        );

        const revocationListEncoded = await revocationListDecoded.encode();

        const transaction = await new FileUpdateTransaction()
            .setFileId(revocationListFileId)
            .setContents(revocationListEncoded)
            .setMaxTransactionFee(new Hbar(2))
            .freezeWith(this.client);

        const signTx = await transaction.sign(HcsVc.TEST_FILE_KEY);
        const submitTx = await signTx.execute(this.client);
        await submitTx.getReceipt(this.client);

        return revocationListDecoded;
    }

    private createSigner(key: PrivateKey, did: string): Issuer {
        return {
            did,
            signer: (msg: string | Uint8Array) => {
                const input = typeof msg === "string" ? u8a.fromString(msg) : msg;
                const sig = key.sign(input);
                return Promise.resolve(u8a.toString(sig, "base64url"));
            },
            // ref: https://tools.ietf.org/html/rfc8037#appendix-A.4
            alg: "EdDSA",
        };
    }
}
