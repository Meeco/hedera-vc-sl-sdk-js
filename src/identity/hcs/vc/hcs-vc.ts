import { Client, Hbar, PrivateKey, Timestamp, TopicId } from "@hashgraph/sdk";
import { MessageEnvelope } from "../message-envelope";
import { HcsVcMessage } from "./hcs-vc-message";
import * as vc from "did-jwt-vc";
import { Issuer } from "did-jwt-vc";
import * as u8a from "uint8arrays";
import { W3CCredential } from "./w3c-credential";

export type VCJWT = string;

export class HcsVc {
    public static TRANSACTION_FEE = new Hbar(2);
    public static READ_TOPIC_MESSAGES_TIMEOUT = 5000;

    protected client: Client;
    protected identifier: string;
    protected network: string;
    protected topicId: TopicId;

    protected messages: HcsVcMessage[];
    protected resolvedAt: Timestamp;

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

    constructor(protected issuerDID: string, protected privateKey: PrivateKey) {
        // signs with EdDSA/Ed2219
        this._issuer = this.createSigner(this.privateKey, this.issuerDID);
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
    }): Promise<W3CCredential<any>> {
        return W3CCredential.create(args, this._issuer);
    }

    async submitVC(vcToBeSubmitted: VCJWT) {
        const hashedVC = W3CCredential.fromJWT(vcToBeSubmitted).hash();

        // submit transaciton
        throw new Error("Method not implemented");
    }

    async revokeByHash(vcHash: string) {
        throw new Error("Method not implemented");
    }

    async getStatus(vcHash: string) {
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
        VcMethodOperation: any,
        event: any,
        privateKey: PrivateKey
    ): Promise<MessageEnvelope<any>> {
        throw new Error("Method not implemented.");
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
