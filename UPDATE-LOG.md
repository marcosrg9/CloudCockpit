# CloudCockpit 0.2.0

- This version implements credentials management for each server, allowing for adding, editing, and deleting them.

- A NodeJS version detection mechanism has been implemented to prevent failures when the process starts, for example, `structuredClone` is only available in Node 17.

- The CloudCockpit server now responds via HTTPS. If OpenSSL is installed, an x509 certificate will be created and added to the server each time CloudCockpit starts. If the installation is not found, an HTTP server will be started.

- Terminal sizes are now correctly interpreted upon startup.

- The server router has been prepared to handle requests to the user interface and respond to any other requests, allowing the Angular router to come into play when necessary.

- A performance issue has been fixed on the client, where accessing server details would exponentially slow down. This was caused by the improper destruction of router event subscriptions.

- A synchronized store has been added, acting as a proxy between the server and the end client. This allows for retrieving and setting records using a more natural method, such as those provided by the `Map` class, leveraging WebSocket events.

- An event dictionary has been added, storing event names for reuse on both the server and the client. This provides an exact reference for these events. Additionally, it is a literal object with key-value pairs, but its content is frozen, preventing accidental modification and safeguarding against unintended errors.

- A bug that prevented automatic redirection to the CloudCockpit initialization wizard when the platform needed initialization has been fixed.

- The UIKit Icons package has been added.

- A favicon has been included.

- An error that caused an unhandled exception when dumping the user store during developer event emission has been resolved.

- Spelling mistakes in code comments have been corrected.