import {
    Client,
    Hbar,
    PrivateKey,
    Timestamp,
    TopicId,
} from "@hashgraph/sdk";



import { MessageEnvelope } from "../message-envelope";
import { HcsVcMessage } from "./hcs-vc-message";

export class HcsVc {

    public static TRANSACTION_FEE = new Hbar(2);
    public static READ_TOPIC_MESSAGES_TIMEOUT = 5000;

    protected client: Client;
    protected privateKey: PrivateKey;
    protected identifier: string;
    protected network: string;
    protected topicId: TopicId;

    protected messages: HcsVcMessage[];
    protected resolvedAt: Timestamp;


    protected onMessageConfirmed: (message: MessageEnvelope<HcsVcMessage>) => void;

    constructor(args: {
        identifier?: string;
        privateKey?: PrivateKey;
        client?: Client;
        onMessageConfirmed?: (message: MessageEnvelope<any>) => void;
    }) {
        throw new Error('Method not implemented.');
    }

    /**
     * Public API
     */

    public async issue() {
        throw new Error('Method not implemented.');
    }


    public async revoke() {
        throw new Error('Method not implemented.');
    }

    public async resolve(): Promise<any> {
        throw new Error('Method not implemented.');
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
        throw new Error('Method not implemented.');
    }
}
