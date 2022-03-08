import { Client, Hbar, PrivateKey, Timestamp, TopicId } from "@hashgraph/sdk";
import { MessageEnvelope } from "../message-envelope";
import { HcsVcMessage } from "./hcs-vc-message";
import * as vc from "did-jwt-vc";
import { Issuer } from "did-jwt-vc";
import * as u8a from "uint8arrays";
import { W3CCredential } from "./w3c-credential";
import { VcMethodOperation } from "../../ vc-method-operation";
import { HcsVcTransaction } from "./hcs-vc-transaction";

export type VCJWT = string;

export class HcsVc {
    public static TRANSACTION_FEE = new Hbar(2);
    public static READ_TOPIC_MESSAGES_TIMEOUT = 5000;

    protected onMessageConfirmed: (message: MessageEnvelope<HcsVcMessage>) => void;

    // constructor(args: {
    //     identifier?: string;
    //     privateKey?: PrivateKey;
    //     client?: Client;
    //     onMessageConfirmed?: (message: MessageEnvelope<any>) => void;
    // }) {
    //     throw new Error('Method not implemented.');
    // }

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

    /**
     * Add credential meta-data and sign, but do not submit.
     * @returns JWT encoded VC
     */
    async issue(args: {
        credentialSubject: any;
        expiration: Date;
        contexts?: string[];
        evidence?: any;
        credentialSchema: { id: string; type: string } | Array<{ id: string; type: string }>;
    }) {
        const credential = await W3CCredential.create(args, this._issuer);
        const credentialHash = credential.hash();
        this.submitTransaction(VcMethodOperation.ISSUE, credentialHash, this.issuerPrivateKey);
        return credential;
    }

    async revokeByHash(credentialHash: string) {
        throw new Error("Method not implemented");
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
