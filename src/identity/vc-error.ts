export enum VCErrorCode {
    GENERIC = "generic",
    INVALID_VC_STRING = "invalid_Vc_string",
    INVALID_NETWORK = "invalid_network",
    /**
     * VC_NOT_FOUND is not thrown anywhere at the moment
     */
    VC_NOT_FOUND = "Vc_not_found",
}

export class VCError extends Error {
    public code: VCErrorCode;

    constructor(message: string, code: VCErrorCode = VCErrorCode.GENERIC) {
        super(message);
        this.code = code;
    }
}
