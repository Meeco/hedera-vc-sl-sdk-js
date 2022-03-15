import { W3CCredential } from "./w3c-credential";
import { Issuer } from "did-jwt-vc";
import { PrivateKey } from "@hashgraph/sdk";
import * as u8a from "uint8arrays";

export class VC {
    protected _issuer: Issuer;

    constructor(protected issuerDID: string, protected issuerPrivateKey: PrivateKey) {
        // signs with EdDSA/Ed2219
        this._issuer = this.createSigner(this.issuerPrivateKey, this.issuerDID);
    }

    get signer() {
        return this._issuer;
    }

    async issue(
        args: {
            credentialSubject: any;
            expiration: Date;
            contexts?: string[];
            evidence?: any;
            credentialSchema: { id: string; type: string } | Array<{ id: string; type: string }>;
        },
        revocationListFileId: string,
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
                revocationListCredential: `https://example.com/credentials/status/${revocationListFileId}`,
            };

            const credential = await W3CCredential.create(args, this._issuer);
            return credential;
        } catch (err) {
            console.error(err);
        }
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
