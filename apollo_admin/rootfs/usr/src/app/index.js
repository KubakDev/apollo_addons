const mqtt = require('mqtt');
const { HubConnectionBuilder, LogLevel } = require('@microsoft/signalr');

// Configuration (update these with your actual URLs and topics)
const config = {
    mqttUrl: 'mqtt://apollo.local:1883',
    username: 'mqtt',
    password: '15217320',
    protocolVersion: 5,
    apolloAdminRequest: 'apolloadmin/apolloserver/request',
    apolloAdminAuth: 'apolloadmin/apolloserver/auth',
    apolloAdminReady: 'apolloadmin/ready',
    apolloServerRequest: "apolloadmin/apolloserver",
    baseUrl: 'http://tunl.kubakgroup.com:90'
};

// Create an MQTT client
const mqttClient = mqtt.connect(config.mqttUrl, {
    username: config.username,
    password: config.password,
    protocolVersion: config.protocolVersion,
    properties: {
        requestResponseInformation: true
    }
});

let signalRConnection;





// Connect to MQTT
mqttClient.on('connect', async () => {
    console.log('Connected to MQTT');
    await mqttClient.subscribe([config.apolloAdminRequest, config.apolloAdminAuth]);

    msg = {success:true,result:'ready'}
    sendMqttMessage(config.apolloAdminReady,msg);
    console.log(`Subscribed to MQTT topics: ${config.apolloAdmin}, ${config.apolloAdminAuth}`);
});



// MQTT message handling
mqttClient.on('message', async (topic, message, packet) => {
    console.log(`Received message from ${topic}: ${message.toString()}`);

    // Extract responseTopic and correlationData with null checks
    const { responseTopic = null, correlationData = null } = packet.properties || {};
    const msg = message.toString();
    switch (topic) {
        case config.apolloAdminAuth:
            
            if (responseTopic && correlationData) {
                await setupSignalRConnection(msg, responseTopic, correlationData);
            } else {
                console.log('Missing responseTopic or correlationData; cannot setup SignalR connection.');
            }
            break;
        case config.apolloAdminRequest:
            if (responseTopic && correlationData) {
                invokeSignalRMethod(msg, responseTopic,correlationData);
            } else {
                console.log('Missing responseTopic or correlationData; cannot continue.');
            }

            break;
        // Add more cases as needed for other topics
        default:
            console.log(`No handler for topic: ${topic}`);
            break;
    }
});



// Function to send an MQTT message
function sendMqttMessage(topic, payload, correlationData = "1") {
    const options = {
        properties: {
            correlationData: Buffer.from(correlationData)
        }
    };

    if (typeof payload !== 'string') {
        payload = JSON.stringify(payload);
    }

    mqttClient.publish(topic, payload, options, (err) => {
        if (err) {
            console.error('Publish error:', err);
        } else {
            console.log('Message sent:', topic, payload, options.properties);
        }
    });
}







// Setup SignalR connection
async function setupSignalRConnection(token, responseTopic, correlationData) {
    const baseUrlWithToken = `${config.baseUrl}/apollo-hub?access-token=${token}`;
    signalRConnection = new HubConnectionBuilder()
        .withUrl(baseUrlWithToken)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

    try {
        await signalRConnection.start();
        console.log('Connected to SignalR');
        if (signalRConnection.state === "Connected") {
            const msg = { success: true, result: "Connected to SignalR" };
            sendMqttMessage(responseTopic, msg, correlationData);
        }
    } catch (err) {
        console.error('SignalR connection error:', err);
        setTimeout(() => setupSignalRConnection(token, responseTopic, correlationData), 5000); // Retry connection
    }

    signalRConnection.onclose(async () => {
        console.log('SignalR connection lost. Attempting to reconnect...');
        await setupSignalRConnection(token, responseTopic, correlationData);
    });

        // Handle server-sent events named "Request"
        signalRConnection.on("Request", (data) => {
            console.log("Received data from server on 'Request':", data);
            try {
                sendMqttMessage(config.apolloServerRequest,data);
                
            } catch (error) {
                console.log(error)
            }
        });

}







// Async function to invoke a method on SignalR and handle the response
async function invokeSignalRMethod(msg, responseTopic, correlationData) {
    if (signalRConnection && signalRConnection.state === "Connected") {
        try {
            parsedMsg = JSON.parse(msg);
            methodName = parsedMsg.command;
            methodArgs = parsedMsg.data;
            const response = await signalRConnection.invoke(methodName, methodArgs);
            payload = response;
            console.log(`Response from ${methodName}:`, response);

            sendMqttMessage(responseTopic,payload,correlationData);

        } catch (error) {
            console.error(`Error invoking ${methodName} on SignalR:`, error);
            // Optionally handle or rethrow the error based on your use case
            
             // Construct a meaningful error message
             const errorMsg = {
        
                    name: error.name,
                    message: error.message,
                    stack: error.stack // Optionally include the stack trace if useful
                
            };

            payload = {success:false,error:errorMsg};
            sendMqttMessage(responseTopic,payload,correlationData);
        }
    } else {
        console.log('SignalR is not connected. Sending ready message.');
        const msg = { success: true, result: 'ready' };
        sendMqttMessage(config.apolloAdminReady, msg);
    }
}








// MQTT reconnect and error handling
mqttClient.on('reconnect', () => {
    console.log('Reconnecting to MQTT...');
});

mqttClient.on('error', (err) => {
    console.log('MQTT Error:', err);
});

// Exit gracefully
process.on('SIGINT', async () => {
    if (mqttClient) {
        mqttClient.end();
    }
    if (signalRConnection) {
        await signalRConnection.stop();
    }
    console.log('Gracefully shutting down...');
    process.exit(0);
});

// Periodic check to ensure SignalR connection is active
setInterval(async () => {
    if (!signalRConnection || signalRConnection.state !== "Connected") {
        console.log('SignalR connection is not active. Attempting to reconnect...');
        // Attempt to reconnect or handle the logic as required; example uses a simple message send
        const msg = { success: true, result: 'ready' };
        sendMqttMessage(config.apolloAdminReady, msg);
    } else {
        console.log('SignalR connection is active and healthy.');
    }
}, 600000);  // 600000 milliseconds = 10 minutes
