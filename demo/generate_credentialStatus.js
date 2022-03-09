async function write({ credential } = {}) {
    assert.object(credential, "credential");

    const {
        documentStore: { serviceObjectId },
    } = this;
    let shardQueue = SHARD_QUEUE_CACHE.get(serviceObjectId);
    if (!shardQueue) {
        shardQueue = [];
        SHARD_QUEUE_CACHE.set(serviceObjectId, shardQueue);
    }

    // get `edvClient` directly; do not use cache in `documentStore` to ensure
    // latest docs are used
    const {
        documentStore: { edvClient },
    } = this;

    // 1. If an LS has been assigned to the writer instance (then a duplicate
    // error for the VC is being handled):
    const { listShard } = this;
    if (listShard) {
        const { credentialStatus } = credential;
        assert.object(credentialStatus, "credentialStatus");

        // 1.1. Read the IAD.
        const {
            indexAssignmentDoc,
            item: { slSequence },
        } = listShard;
        const doc = await edvClient.get({ id: indexAssignmentDoc.id });
        listShard.indexAssignmentDoc = doc;

        // 1.2. If the IAD's SL sequence matches the one from the LS and the
        //   IAD's latest assigned index value is behind the index in the VC's
        //   `credentialStatus` field:
        // FIXME: support `statusListIndex` name
        const { revocationListIndex: statusListIndex } = credentialStatus;
        const localIndex = _getLocalIndex({ listShard, statusListIndex });

        // the nextLocalIndex must be greater than the localIndex from the
        // credentialStatus
        if (doc.content.slSequence === slSequence && doc.content.nextLocalIndex <= localIndex) {
            // 1.2.1. Update the latest assigned index value.
            doc.content.nextLocalIndex = localIndex + 1;
            // 1.2.2. CW update the IAD.
            try {
                await edvClient.update({ doc });
                if (shardQueue.length < MAX_SHARD_QUEUE_SIZE) {
                    shardQueue.push(listShard);
                }
            } catch (e) {
                // ignore conflict error, throw others
                if (e.name !== "InvalidStateError") {
                    throw e;
                }
            }
        }

        // 1.3. Clear the LS from the instance.
        this.listShard = null;
    }

    // 2. If the in-memory set is empty:
    if (shardQueue.length === 0) {
        // 2.1. Create a ListManager instance `listManager`.
        // 2.2. Call listManager.getShard() and store result in the instance.
        const { slcsBaseUrl, documentLoader, documentStore, issuer, statusType, suite } = this;
        const listManager = new ListManager({
            // FIXME: parameterize LM_ID (perhaps create `uuid` for each type
            // of status list supported)
            id: LM_ID,
            slcsBaseUrl,
            documentLoader,
            documentStore,
            issuer,
            statusType,
            suite,
        });
        this.listShard = await listManager.getShard();
    } else {
        // 3. Otherwise, remove an LS from the set and store it in the
        // instance.
        this.listShard = shardQueue.shift();
    }

    // 4. Use the SL ID and the IAD from the LS to add the SL ID and the next
    //   unassigned SL index to a VC's credential status section.
    const {
        item: { statusListCredential },
    } = this.listShard;
    const statusListIndex = _getListIndex({ listShard: this.listShard });
    credential.credentialStatus = {
        // FIXME: support other status types
        id: `${statusListCredential}#${statusListIndex}`,
        type: "RevocationList2020Status",
        // FIXME: support `statusListCredential`
        revocationListCredential: statusListCredential,
        // FIXME: support `statusListIndex`
        revocationListIndex: `${statusListIndex}`,
    };
}
