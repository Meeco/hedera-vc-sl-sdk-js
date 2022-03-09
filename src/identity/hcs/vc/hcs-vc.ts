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
import { VcMethodOperation } from "../../ vc-method-operation";
import { MessageEnvelope } from "../message-envelope";
import { HcsVcMessage } from "./hcs-vc-message";
import { HcsVcTransaction } from "./hcs-vc-transaction";
import { W3CCredential } from "./w3c-credential";
const rl = require("vc-revocation-list");

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

    protected onMessageConfirmed: (message: MessageEnvelope<HcsVcMessage>) => void;

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
        const revocationList = await rl.createList({ length: HcsVc.REVOCATION_LIST_LENGTH });
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
        const decodedStatusList = await rl.decodeList({ encodedList: encodedStatusList.toString() });

        return decodedStatusList;
    }

    /**
     * Add credential meta-data and sign, but do not submit.
     * @returns JWT encoded VC
     */
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
            // const credentialHash = credential.hash();
            // this.submitTransaction(VcMethodOperation.ISSUE, credentialHash, this.issuerPrivateKey);
            return credential;
        } catch (err) {
            console.error(err);
        }
    }

    async revokeByIndex(revocationListFileId: FileId, revocationListIndex: number) {
        const revocationList = await this.loadRevocationList(revocationListFileId);
        revocationList.setRevoked(revocationListIndex, true);
        const revocationListEncoded = await revocationList.encode();

        const transaction = await new FileUpdateTransaction()
            .setFileId(revocationListFileId)
            .setContents(revocationListEncoded)
            .setMaxTransactionFee(new Hbar(2))
            .freezeWith(this.client);

        const signTx = await transaction.sign(HcsVc.TEST_FILE_KEY);
        const submitTx = await signTx.execute(this.client);
        await submitTx.getReceipt(this.client);

        return true;
    }

    async revokeByHash(credentialHash: string) {
        this.submitTransaction(VcMethodOperation.REVOKE, credentialHash, this.issuerPrivateKey);
    }

    async getStatus(credentialHash: string) {
        throw new Error("Method not implemented");
    }

    /**
     * Submit Message Transaction to Hashgraph
     * @param vcMethodOperation
     * @param event
     * @param privateKey
     * @returns this
     */
    private async submitTransaction(
        VcMethodOperation: VcMethodOperation,
        credentialHash: string,
        issuerPrivateKey: PrivateKey
    ): Promise<MessageEnvelope<HcsVcMessage>> {
        const message = new HcsVcMessage(VcMethodOperation, credentialHash);
        const envelope = new MessageEnvelope(message);
        const transaction = new HcsVcTransaction(envelope, this._topicId);

        return new Promise((resolve, reject) => {
            transaction
                .signMessage((msg) => {
                    return issuerPrivateKey.sign(msg);
                })
                .buildAndSignTransaction((tx) => {
                    return tx
                        .setMaxTransactionFee(HcsVc.TRANSACTION_FEE)
                        .freezeWith(this.client)
                        .sign(this.accountPrivateKey);
                })
                .onError((err) => {
                    // console.error(err);
                    reject(err);
                })
                .onMessageConfirmed((msg) => {
                    if (this.onMessageConfirmed) {
                        this.onMessageConfirmed(msg);
                    }

                    console.log("Message Published");
                    console.log(`Explore on DragonGlass: https://testnet.dragonglass.me/hedera/topics/${this.topicId}`);
                    resolve(msg);
                })
                .execute(this.client);
        });
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
