import { createClient } from "../oidc_config/oidc-config.js";

export const { client, code_verifier, code_challenge } = createClient(
  "app-a",
  "http://localhost:3001/callback"
);
