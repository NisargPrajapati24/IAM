import { createClient } from "../oidc_config/oidc-config.js";

export const { client, code_verifier, code_challenge } = createClient(
  "app-b",
  "http://localhost:3002/callback"
);
