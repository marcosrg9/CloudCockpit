# CloudCockpit 0.1.1

CloudCockpit 0.1.1 includes bug fixes.

## Fixes
1. Fixed a bug that sometimes caused terminal outputs to be duplicated in the client for certain sessions.
2. Fixed a bug that did not show connection errors, leaving disconnected terminals open without the client receiving orders.

## Solutions
1. The exact origin of this bug is unknown. It was caused by the duplication of session identifiers in the user model's session store (`user.model.ts`). The store did not check if an identifier already existed, so if a duplicate was found while iterating through it, the server searched again and emitted it to the client. This has been mitigated by using a `Set` object instead of an `Array` that can lead to duplicates. Additionally, when a session is duplicated, the event is logged with a copy of the call stack to inspect this bug in the future.
2. Connection errors were not being emitted to the client, and the server was not removing terminals with connection errors from
