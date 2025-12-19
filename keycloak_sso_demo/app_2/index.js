import express from "express";
import session from "express-session";
import { client, code_verifier, code_challenge } from "./auth.js";
import axios from "axios";

const PORT = 3002;
const app = express();

app.use(
  session({
    secret: "app2_secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Home route
app.get("/", async (req, res) => {
  if (!req.session.tokenSet) {
    // Attempt SSO: check if user is logged in Keycloak using iframe-like request
    return res.send(`<a href="/login">Login with Keycloak</a>`);
  }
  res.send(`
    <h2>Welcome to App2!</h2>
    <p>User: ${req.session.user?.preferred_username}</p>
    <a href="/logout">Logout</a>
    <br><a href="http://localhost:3001/">Go to App1</a>
  `);
});

// Login route
app.get("/login", (req, res) => {
  req.session.code_verifier = code_verifier;
  const authUrl = client.authorizationUrl({
    scope: "openid profile email",
    code_challenge,
    code_challenge_method: "S256",
  });
  res.redirect(authUrl);
});

// Callback route
app.get("/callback", async (req, res) => {
  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(
      "http://localhost:3002/callback",
      params,
      { code_verifier: req.session.code_verifier }
    );
    req.session.tokenSet = tokenSet;

    const userinfo = await client.userinfo(tokenSet.access_token);
    req.session.user = userinfo;

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Login failed");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  const idToken = req.session.tokenSet?.id_token;
  req.session.destroy(() => {
    let logoutUrl = `http://localhost:8080/realms/demo-realm/protocol/openid-connect/logout`;
    if (idToken) {
      logoutUrl += `?id_token_hint=${idToken}&post_logout_redirect_uri=http://localhost:3002/`;
    }
    res.redirect(logoutUrl);
  });
});

app.listen(PORT, () =>
  console.log(` App2 running on http://localhost:${PORT}`)
);
