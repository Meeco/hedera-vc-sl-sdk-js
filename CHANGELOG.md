
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# v1.0.0
## Added

[status-list-spec]: https://w3c-ccg.github.io/vc-status-list-2021/
[hedera-services]: https://hedera.com/services

Initial implementation of [verifiable credential status list][status-list-spec] for [Hedera services][hedera-services].

### Status List API's

* Create status list file

    ```js
    ...
    const fileId = await hfsvcsl.createStatusListFile();
    ```

* Load status list

    ```js
    ...
    const statusList = await hfsvcsl.loadStatusList(fileId);
    ```

* Resolve verifiable credential status by index

    ```js
    ...
    const status = await hfsvcsl.resolveStatusByIndex(fileId, index);
    ```

* Update credential status by index

    ```js
    ...
    // set status to revoked
    const updatedStatusList = await hfsvcsl.revokeByIndex(fileId, index)
    ...
    // set status to active
    const updatedStatusList = await hfsvcsl.issueByIndex(fileId, index)
    ...
    // set status to suspended
    const updatedStatusList = await hfsvcsl.suspendByIndex(fileId, index)
    ...
    // set status to resumed
    const updatedStatusList = await hfsvcsl.resumeByIndex(fileId, index)
    ```
