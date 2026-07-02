exports.handler = async function() {
  const {
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_BRANCH = "main",
    PICLOG_PATH = "piclog.json"
  } = process.env;

  if (!GITHUB_OWNER || !GITHUB_REPO) {
    return jsonResponse(500, { error: "missing GitHub environment variables" });
  }

  const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponentPath(PICLOG_PATH)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "netlify-piclog-widget"
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(fileUrl, { headers });

  if (!response.ok) {
    return jsonResponse(500, { error: "could not load piclog" });
  }

  const file = await response.json();
  const raw = Buffer.from(file.content, "base64").toString("utf8");
  const data = JSON.parse(raw);

  return jsonResponse(200, {
    src: data.src || data.imageUrl || data.image || data.url || "",
    updatedAt: data.updatedAt || ""
  });
};

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
