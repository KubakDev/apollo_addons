// import fs from "fs";
// import yaml from "yaml";

// const configFilePath = "/homeassistant/secrets.yaml";

// interface SignalRConfig {
//   baseUrl: string;
//   hubName: string;
//   loginPath: string;
//   apolloUsername: string;
//   apolloPassword: string;
//   supervisorToken?: string; // Optional field to hold the SUPERVISOR_TOKEN
//   supervisorSocketPath: string;
//   onDemandSocketPath: string;
// }

// interface ApolloAuthConfig {
//   client_id: string;
//   redirect_uri: string;
//   auth_providers_uri: string;
//   auth_login_flow_uri: string;
//   auth_token_uri: string;
// }

// interface PersistentData {
//   isSetup: boolean;
//   superadminToken: string;
// }

// interface Config {
//   apollo_admin: SignalRConfig;
//   apollo_auth: ApolloAuthConfig;
//   persistent_data: PersistentData;
// }

// // Read the configuration file
// const file = fs.readFileSync(configFilePath, "utf8");
// const config = yaml.parse(file) as Config;

// // Get the SUPERVISOR_TOKEN from environment variables
// const supervisorToken = process.env.SUPERVISOR_TOKEN;

// // Check if the SUPERVISOR_TOKEN is available and add it to the configuration
// if (supervisorToken) {
//   config.apollo_admin.supervisorToken = supervisorToken;
// }


// const updatePersistentData = (newData: Partial<PersistentData>) => {
//   const updatedData = { ...config.persistentData, ...newData };
//   fs.writeFileSync(persistentDataFilePath, JSON.stringify(updatedData, null, 2));
//   config.persistentData = updatedData;
// };

// export { config as default, updatePersistentData };


// import fs from "fs";
// import yaml from "yaml";

// const configFilePath = "/homeassistant/secrets.yaml";
// const persistentDataFilePath = "/homeassistant/persistent_data.json";

// interface SignalRConfig {
//   baseUrl: string;
//   hubName: string;
//   loginPath: string;
//   apolloUsername: string;
//   apolloPassword: string;
//   supervisorToken?: string; // Optional field to hold the SUPERVISOR_TOKEN
//   supervisorSocketPath: string;
//   onDemandSocketPath: string;
// }

// interface ApolloAuthConfig {
//   client_id: string;
//   redirect_uri: string;
//   auth_providers_uri: string;
//   auth_login_flow_uri: string;
//   auth_token_uri: string;
// }

// interface PersistentData {
//   isSetup: boolean;
//   superadminToken: string;
// }

// interface Config {
//   apollo_admin: SignalRConfig;
//   apollo_auth: ApolloAuthConfig;
//   persistent_data: PersistentData;
// }

// // Read the configuration file
// const file = fs.readFileSync(configFilePath, "utf8");
// const config = yaml.parse(file) as Config;

// // Get the SUPERVISOR_TOKEN from environment variables
// const supervisorToken = process.env.SUPERVISOR_TOKEN;

// // Check if the SUPERVISOR_TOKEN is available and add it to the configuration
// if (supervisorToken) {
//   config.apollo_admin.supervisorToken = supervisorToken;
// }

// const updatePersistentData = (newData: Partial<PersistentData>) => {
//   // Update the persistent data within the config object
//   config.persistent_data = { ...config.persistent_data, ...newData };

//   // Write the updated config back to the YAML file
//   const yamlStr = yaml.stringify(config);
//   fs.writeFileSync(configFilePath, yamlStr);
// };

// export { config as default, updatePersistentData };


import fs from "fs";
import yaml from "yaml";

const configFilePath = "/homeassistant/secrets.yaml";
const persistentDataFilePath = "/homeassistant/persistent_data.json";

interface SignalRConfig {
  baseUrl: string;
  hubName: string;
  loginPath: string;
  apolloUsername: string;
  apolloPassword: string;
  supervisorToken?: string; // Optional field to hold the SUPERVISOR_TOKEN
  supervisorSocketPath: string;
  onDemandSocketPath: string;
}

interface ApolloAuthConfig {
  client_id: string;
  redirect_uri: string;
  auth_providers_uri: string;
  auth_login_flow_uri: string;
  auth_token_uri: string;
}

interface PersistentData {
  isSetup: boolean;
  superadminToken: string;
}

interface Config {
  apollo_admin: SignalRConfig;
  apollo_auth: ApolloAuthConfig;
  persistent_data: PersistentData;
}

// Read the configuration file
const file = fs.readFileSync(configFilePath, "utf8");
const config = yaml.parse(file) as Config;

// Read the persistent data from the JSON file
const readPersistentData = (): PersistentData => {
  try {
    const data = fs.readFileSync(persistentDataFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If there's an error reading the file, default to initial values
    return { isSetup: false, superadminToken: "" };
  }
};
// Get the SUPERVISOR_TOKEN from environment variables
const supervisorToken = process.env.SUPERVISOR_TOKEN;

// Check if the SUPERVISOR_TOKEN is available and add it to the configuration
if (supervisorToken) {
  config.apollo_admin.supervisorToken = supervisorToken;
}

// Add persistent data to the config object
config.persistent_data = readPersistentData();


const updatePersistentData = (newData: Partial<PersistentData>) => {
  console.log("Updating persistent data");
  
  const currentData = readPersistentData();
  const updatedData = { ...currentData, ...newData };
  fs.writeFileSync(persistentDataFilePath, JSON.stringify(updatedData, null, 2));
};

export { config as default, updatePersistentData };
