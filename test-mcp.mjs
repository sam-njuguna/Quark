import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const ENDPOINT = "http://localhost:3000/api/mcp";

async function test() {
  const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT));

  try {
    await transport.start();
    console.log("Transport started");

    try {
      await transport.send({
        jsonrpc: "2.0",
        id: "1",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      });
    } catch (sendErr) {
      console.log("Send error caught:", sendErr);
      console.log("Error code:", sendErr.code);
      console.log("Error cause:", sendErr.cause);
      if (sendErr.cause) {
        console.log("Cause message:", sendErr.cause.message);
      }
    }

    await transport.close();
  } catch (err) {
    console.error("Transport error:", err);
  }
}

test();
