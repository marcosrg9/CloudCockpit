# CloudCockpit 0.1.2

This commit introduces an abstraction for sockets in the codebase, allowing for more modular and flexible socket handling. The `AbstractSocket` class has been created to define a common interface for different socket implementations. Additionally, the `removeAllListeners` method is now called from the `AbstractSocket` class, making it easier to remove listeners from all sockets in one go.
