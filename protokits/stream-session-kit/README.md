# Stream Session Kit

Renderer-agnostic stream session state, connection status, heartbeat, and latency descriptors.

Services: `open`, `markConnected`, `markDisconnected`, `heartbeat`, and `snapshot`.

Provides: `stream:session`, `stream:connection-state`, and `stream:heartbeat`.

This kit does not own WebSocket, SSE, WebTransport, or fetch.
