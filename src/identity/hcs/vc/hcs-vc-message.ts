import { Timestamp, TopicId } from "@hashgraph/sdk";
import Long from "long";
import { TimestampUtils } from "../../../utils/timestamp-utils";
import { VcMethodOperation } from "../../ vc-method-operation";

export type Signer<T> = (message: T) => T;

/**
 * The Vc document message submitted to appnet's Vc Topic.
 */
export class HcsVcMessage {
    protected timestamp: Timestamp;
    protected operation: VcMethodOperation;
    protected credentialHash: string;

    /**
     * Creates a new instance of {@link HcsVcMessage}.
     *
     * @param operation         The operation on Vc document.
     * @param credentialHash    The credential Hash string.
     */
    constructor(operation: VcMethodOperation, credentialHash: string) {
        this.timestamp = TimestampUtils.now();
        this.operation = operation;
        this.credentialHash = credentialHash;
    }

    public getTimestamp(): Timestamp {
        return this.timestamp;
    }

    public getOperation(): VcMethodOperation {
        return this.operation;
    }

    public getVcHash(): string {
        return this.credentialHash;
    }

    /**
     * Validates this Vc message by checking its completeness, signature and Vc document.
     *
     * @param VcTopicId The Vc topic ID against which the message is validated.
     * @return True if the message is valid, false otherwise.
     */
    public isValid(): boolean;
    public isValid(VcTopicId: TopicId): boolean;
    public isValid(...args: any[]): boolean {
        const VcTopicId: TopicId = args[0] || null;

        if (this.credentialHash == null || this.operation == null) {
            return false;
        }

        try {
            //TODO: add more validation
        } catch (e) {
            return false;
        }

        return true;
    }

    public toJsonTree(): any {
        const result: any = { timestamp: TimestampUtils.toJSON(this.timestamp) };
        result.operation = this.operation;
        result.credentialHash = this.credentialHash;

        return result;
    }

    public static fromJsonTree(tree: any, result?: HcsVcMessage): HcsVcMessage {
        if (!result) {
            result = new HcsVcMessage(tree.operation, tree.credentialHash);
        } else {
            result.operation = tree.operation;
            result.credentialHash = tree.credentialHash;
        }
        result.timestamp = TimestampUtils.fromJson(tree.timestamp);
        return result;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    public static fromJson(json: string): HcsVcMessage {
        return HcsVcMessage.fromJsonTree(JSON.parse(json));
    }
}
