const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Store connected clients
const clients = [];

// Middleware for SSE connections
function eventsHandler(req, res, next) {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send an initial connection message
  res.write(
    `data: ${JSON.stringify({
      type: "connection",
      message: "Connected to SSE",
    })}\n\n`
  );

  // Create client object
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response: res,
  };

  // Add this client to the clients array
  clients.push(newClient);
  console.log(`Client ${clientId} connected, total clients: ${clients.length}`);

  // When client closes connection, remove from the clients array
  req.on("close", () => {
    console.log(`Client ${clientId} disconnected`);
    const index = clients.findIndex((client) => client.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
      console.log(
        `Removed client ${clientId}, remaining clients: ${clients.length}`
      );
    }
  });
}

// Route for clients to connect to SSE
app.get("/events", eventsHandler);

// Endpoint that receives data from Lambda
app.post("/data-updates", (req, res) => {

  // Get the data sent by Lambda
  const { records } = req.body;
  console.log("Received data from Lambda:", records);

  // Send the update to all connected clients
  sendEventsToClients(records);

  // Send a success response to Lambda
  res.status(200).json({ success: true, clientCount: clients.length });
});

// Function to send events to all connected clients
function sendEventsToClients(data) {
  clients.forEach((client) => {
    // Prepare the data in SSE format
    const eventData = `data: ${JSON.stringify(data)}\n\n`;

    // Send the data to the client
    client.response.write(eventData);

    console.log(`Data sent to client ${client.id}`);
  });
}

// Start the server
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`SSE Server running on port ${PORT}`);
});

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", clientCount: clients.length });
});
