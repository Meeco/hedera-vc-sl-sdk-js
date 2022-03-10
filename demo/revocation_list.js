const rl = require("vc-revocation-list");
const bs = require("@digitalbazaar/bitstring");

async function main() {
    const revocationList = await rl.createList({ length: 2 });

    const bitstring = new bs.default({ length: 10 });
    bitstring.set(1, true);
    bitstring.set(0, true);

    console.log(revocationList);

    console.log(bitstring.get(3));
}

main();
