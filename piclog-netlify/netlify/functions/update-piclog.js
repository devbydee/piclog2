exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "method not allowed" });
  }

  const {
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_BRANCH = "main",
    PICLOG_PATH = "piclog.json",
    PICLOG_PASSWORD
  } = process.env;

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !PICLOG_PASSWORD) {
    return jsonResponse(500, { error: "missing Netlify environment variables" });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "invalid json" });
  }

  if (body.password !== PICLOG_PASSWORD) {
    return jsonResponse(401, { error: "wrong password" });
  }

  const imageUrl = String(body.imageUrl || "").trim();

  if (!isValidImageUrl(imageUrl)) {
    return jsonResponse(400, { error: "paste a valid image url" });
  }

  const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponentPath(PICLOG_PATH)}`;
  const headers = {
    "Authorization": `Bearer ${GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "User-Agent": "netlify-piclog-admin"
  };

  let sha = null;

  const getResponse = await fetch(`${fileUrl}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, { headers });

  if (getResponse.ok) {
    const currentFile = await getResponse.json();
    sha = currentFile.sha;
  } else if (getResponse.status !== 404) {
    const errorText = await getResponse.text();
    return jsonResponse(500, { error: "could not read GitHub file", details: errorText });
  }

  const piclogData = {
    src: imageUrl,
    updatedAt: new Date().toISOString()
  };

  const content = Buffer.from(JSON.stringify(piclogData, null, 2)).toString("base64");

  const putResponse = await fetch(fileUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "update piclog image",
      content,
      sha,
      branch: GITHUB_BRANCH
    })
  });

  if (!putResponse.ok) {
    const errorText = await putResponse.text();
    return jsonResponse(500, { error: "could not update GitHub file", details: errorText });
  }

  return jsonResponse(200, { ok: true, src: imageUrl });
};

function isValidImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function encodeURIComponentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}
