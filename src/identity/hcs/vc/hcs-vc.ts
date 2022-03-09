import { Client, Hbar, PrivateKey, Timestamp, TopicId } from "@hashgraph/sdk";
import { MessageEnvelope } from "../message-envelope";
import { HcsVcMessage } from "./hcs-vc-message";
import * as vc from "did-jwt-vc";
import { Issuer } from "did-jwt-vc";
import * as u8a from "uint8arrays";
import { W3CCredential } from "./w3c-credential";
import { VcMethodOperation } from "../../ vc-method-operation";
import { HcsVcTransaction } from "./hcs-vc-transaction";
import fs from "fs";
const rl = require("vc-revocation-list");

export type VCJWT = string;

export class HcsVc {
    public static TRANSACTION_FEE = new Hbar(2);
    public static READ_TOPIC_MESSAGES_TIMEOUT = 5000;

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
        /**
         * TODO: issue VC
         * read file content from hedera
         * decode revocation list
         * check revocation list size
         * create new one with size + 1
         * encode new revocation list
         * update hedera file with revocation list
         * assign length index to VC RevocationList2020Status
         * generate VC
         *
         */
        try {
            const encodedStatusList = fs.readFileSync("./demo/file.txt", "utf8");
            console.log(encodedStatusList);
            const decodedStatusList = encodedStatusList
                ? await rl.decodeList({ encodedList: encodedStatusList })
                : await rl.createList({ length: 1 });

            console.log(decodedStatusList);

            const newDecodedStatusList =
                decodedStatusList.length > 1
                    ? await rl.createList({ length: decodedStatusList.length + 1 })
                    : decodedStatusList;

            console.log(decodedStatusList);

            let i: number = 0;
            while (i < newDecodedStatusList.length - 1) {
                console.log("index" + i);
                newDecodedStatusList.setRevoked(i, decodedStatusList.isRevoked(i));
                i++;
            }

            console.log(newDecodedStatusList);

            const newEncodedStatusList = await newDecodedStatusList.encode();
            fs.writeFileSync("./demo/file.txt", newEncodedStatusList);

            args["credentialStatus"] = {
                id: `https://dmv.example.gov/credentials/status/3#${newDecodedStatusList.length}`,
                type: "RevocationList2020Status",
                revocationListIndex: `${newDecodedStatusList.length}`,
                revocationListCredential: "https://example.com/credentials/status/3",
            };

            const credential = await W3CCredential.create(args, this._issuer);
            // const credentialHash = credential.hash();
            // this.submitTransaction(VcMethodOperation.ISSUE, credentialHash, this.issuerPrivateKey);
            return credential;
        } catch (err) {
            console.error(err);
        }
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
