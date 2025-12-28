export const IBM_CONFIG = {
    clientId: process.env.IBM_APP_ID_CLIENT_ID || "f87107a5-0c81-48f9-9f48-215f2997569f",
    oauthServerUrl: process.env.IBM_APP_ID_OAUTH_SERVER_URL || "https://eu-gb.appid.cloud.ibm.com/oauth/v4/71c98e2e-cc08-453c-a44b-1cd123135283",
    profilesUrl: process.env.IBM_APP_ID_PROFILES_URL || "https://eu-gb.appid.cloud.ibm.com",
    secret: process.env.IBM_APP_ID_SECRET || "YThkNDFmNTktOTQxOC00NGYwLTk4NjAtYmFhYzQxYjRlNWZk",
    tenantId: process.env.IBM_APP_ID_TENANT_ID || "71c98e2e-cc08-453c-a44b-1cd123135283",
    redirectUri: process.env.IBM_APP_ID_REDIRECT_URI || "http://localhost:3000/ibm/cloud/appid/callback",
    discoveryEndpoint: process.env.IBM_APP_ID_DISCOVERY_ENDPOINT || "https://eu-gb.appid.cloud.ibm.com/oauth/v4/71c98e2e-cc08-453c-a44b-1cd123135283/.well-known/openid-configuration"
};
