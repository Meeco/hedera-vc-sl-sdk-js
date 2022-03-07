import { Timestamp, TopicId } from "@hashgraph/sdk";
import Long from "long";
import { TimestampUtils } from "../../../utils/timestamp-utils";
import { VcMethodOperation } from "../../ vc-method-operation";

export type Signer<T> = (message: T) => T;

/**
 * The Vc document message submitted to appnet's Vc Topic.
 */
export class HcsVcMessage {
    private static serialVersionUID = Long.fromInt(1);

    protected timestamp: Timestamp;
    protected operation: VcMethodOperation;
    protected vc: string;

    /**
     * Creates a new instance of {@link HcsVcMessage}.
     *
     * @param operation         The operation on Vc document.
     * @param vcHash               The vc Hash string.
     */
    constructor(operation: VcMethodOperation, vc: string) {
        this.timestamp = TimestampUtils.now();
        this.operation = operation;
        this.vc = vc;
    }

    public getTimestamp(): Timestamp {
        return this.timestamp;
    }

    public getOperation(): VcMethodOperation {
        return this.operation;
    }

    public getVcHash(): string {
        return this.vc;
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

        if (this.vc == null || this.operation == null) {
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
        result.vc = this.vc;

        return result;
    }

    public static fromJsonTree(tree: any, result?: HcsVcMessage): HcsVcMessage {
        if (!result) {
            result = new HcsVcMessage(tree.operation, tree.vc);
        } else {
            result.operation = tree.operation;
            result.vc = tree.vc;
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
