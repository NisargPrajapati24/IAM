import { Issuer, generators } from "openid-client";

export const KEYCLOAK_URL = "http://localhost:8080";
export const REALM = "demo-realm";

const oidcIssuer = await Issuer.discover(`${KEYCLOAK_URL}/realms/${REALM}`);

export function createClient(clientId, redirectUri) {
  const client = new oidcIssuer.Client({
    client_id: clientId,
    redirect_uris: [redirectUri],
    response_types: ["code"],
    token_endpoint_auth_method: "none"
  });

  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);

  return { client, code_verifier, code_challenge };
}
