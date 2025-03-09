import http from "http";

export const handler = async (event) => {
  // Log the received event
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Check if there are any records in the event
  if (!event.Records || event.Records.length === 0) {
    console.log("No records found in the event.");
    return {
      statusCode: 200,
      body: JSON.stringify("No records to process."),
    };
  }

  // Loop through DynamoDB stream records
  for (const record of event.Records) {
    console.log("Processing record:", JSON.stringify(record, null, 2));

    // Check if the event is an INSERT or MODIFY
    if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
      console.log(`Event type: ${record.eventName}`);

      // Extract new image from record
      const newData = record.dynamodb.NewImage;
      console.log("New data extracted:", JSON.stringify(newData, null, 2));

      // Build the notification message
      const message = {
        message: "Data Updated",
        data: newData,
        timestamp: Date.now(),
      };
      console.log("Message to send:", JSON.stringify(message, null, 2));

      const postData = JSON.stringify(message);

      // Define request options using environment variables
      const options = {
        hostname: process.env.EC2_HOST,
        port: process.env.EC2_PORT,
        path: "/notify", // Ensure your Node.js backend has a POST /notify endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      console.log("Sending POST request to EC2:", options);
      console.log("Post data:", postData);

      // Send HTTP POST request to your Node.js server
      await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          console.log(`Response status code: ${res.statusCode}`);
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            console.log(`Response body: ${chunk}`);
          });
          res.on("end", () => {
            console.log("Request completed successfully.");
            resolve();
          });
        });

        req.on("error", (e) => {
          console.error(`Request error: ${e.message}`);
          reject(e);
        });

        req.write(postData);
        req.end();
      });
    } else {
      console.log(`Event type not processed: ${record.eventName}`);
    }
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify("Processed DynamoDB stream event."),
  };
  console.log("Lambda function execution completed. Response:", response);
  return response;
};
