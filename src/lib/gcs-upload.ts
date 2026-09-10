// Google Cloud Storage uploads via plain node:https — no fetch, no google-auth-
// library. (Next.js patches global fetch, which breaks the oauth2 token endpoint
// with "Premature close" in some environments; node:https is immune.)

import { createSign } from "crypto";
import { request as httpsRequest } from "https";
import { randomUUID } from "crypto";

type LoadedSa = { client_email?: string; private_key?: string };

let cachedToken: { token: string; exp: number } | null = null;

function saCredentials(): LoadedSa | null {
  // Read via the admin module's loader (env inline / file path / ADC path)
  // without importing its app initialization.
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  const parse = (raw: string): LoadedSa => {
    let json = raw.trim();
    if (!json.startsWith("{")) json = Buffer.from(json, "base64").toString("utf8");
    return JSON.parse(json);
  };
  if (inline) {
    try {
      return parse(inline);
    } catch {
      /* fall through */
    }
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Node-only
    try {
      return JSON.parse(require("fs").readFileSync(path, "utf8"));
    } catch {
      /* fall through */
    }
  }
  return null;
}

function httpPostForm(host: string, path: string, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      { host, path, method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "content-length": Buffer.byteLength(body) } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout")));
    req.write(body);
    req.end();
  });
}

function httpMultipartUpload(host: string, path: string, token: string, contentType: string, metadata: unknown, content: Buffer): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const boundary = `ub${randomUUID().replace(/-/g, "")}`;
    const metaPart = Buffer.from(`--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\ncontent-type: ${contentType}\r\n\r\n`);
    const endPart = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([metaPart, content, endPart]);
    const req = httpsRequest(
      {
        host,
        path,
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": `multipart/related; boundary=${boundary}`,
          "content-length": body.length,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout")));
    req.write(body);
    req.end();
  });
}

/** OAuth access token for cloud-platform scope (cached until near-expiry). */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.exp) return cachedToken.token;
  const sa = saCredentials();
  if (!sa?.client_email || !sa.private_key) throw new Error("Service account credentials not found");
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/devstorage.read_write https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(sa.private_key.replace(/\\n/g, "\n")).toString("base64url");
  const assertion = `${header}.${claims}.${signature}`;

  const res = await httpPostForm("oauth2.googleapis.com", "/token", `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(assertion)}`);
  if (res.status !== 200) throw new Error(`Token exchange failed (${res.status}): ${res.body.slice(0, 200)}`);
  const json = JSON.parse(res.body) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Token exchange returned no access_token");
  cachedToken = { token: json.access_token, exp: Date.now() + ((json.expires_in ?? 3600) - 120) * 1000 };
  return cachedToken.token;
}

export type GcsUploadResult = { url: string; path: string; bytes: number };

/**
 * Upload a buffer to Firebase Storage with a permanent download token and
 * return the public URL. Throws on failure.
 */
export async function uploadToStorage(bucketName: string, path: string, buffer: Buffer, contentType: string): Promise<GcsUploadResult> {
  const token = randomUUID();
  const accessToken = await getAccessToken();
  const metadata = { name: path, metadata: { firebaseStorageDownloadTokens: token } };
  const res = await httpMultipartUpload(
    "storage.googleapis.com",
    `/upload/storage/v1/b/${encodeURIComponent(bucketName)}/o?uploadType=multipart`,
    accessToken,
    contentType,
    metadata,
    buffer
  );
  if (res.status !== 200) throw new Error(`Storage upload failed (${res.status}): ${res.body.slice(0, 200)}`);
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucketName)}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  return { url, path, bytes: buffer.length };
}
