import express from "express";
import session from "express-session";
import { client, code_verifier, code_challenge } from "./auth.js";

const PORT = 3001;
const app = express();

app.use(
  session({
    secret: "app1_secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Home route
app.get("/", async (req, res) => {
  if (!req.session.tokenSet) {
    return res.send(`<a href="/login">Login with Keycloak</a>`);
  }
  res.send(`
    <h2>Welcome to App1!</h2>
    <p>User: ${req.session.user?.preferred_username}</p>
    <a href="/logout">Logout</a>
    <br><a href="http://localhost:3002/">Go to App2</a>
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
      "http://localhost:3001/callback",
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
      logoutUrl += `?id_token_hint=${idToken}&post_logout_redirect_uri=http://localhost:3001/`;
    }
    res.redirect(logoutUrl);
  });
});

app.listen(PORT, () =>
  console.log(` App1 running on http://localhost:${PORT}`)
);
