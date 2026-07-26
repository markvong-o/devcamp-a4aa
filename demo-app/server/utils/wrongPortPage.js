// =============================================================
// "Wrong port" fallback page -- shown when someone opens the API,
// MCP, or CRM mock server directly in a browser instead of the
// Vite frontend on 5173. Codespaces sometimes surfaces the wrong
// port's "available" notification first (see lab-guide/01-prerequisites.md),
// so this exists as a themed safety net rather than a bare 404.
// =============================================================

// Best-effort server-side guess, used only as the href before JS runs
// (or if it's disabled). Codespaces' port-forwarding proxy rewrites the
// Host header to localhost:PORT before it reaches Express, even though
// the browser is actually on the public *.app.github.dev domain -- so
// this is NOT trustworthy for the Codespaces case. The inline script in
// renderPage() below uses window.location instead, which always reflects
// the real address the browser is showing, and overwrites this on load.
function resolveAppUrl(req) {
  const host = req.headers.host || "localhost:5173";
  const codespacesMatch = host.match(/^(.*)-\d+(\.app\.github\.dev|\.github\.dev)$/);
  if (codespacesMatch) {
    return `https://${codespacesMatch[1]}-5173${codespacesMatch[2]}`;
  }
  const hostname = host.split(":")[0];
  const protocol = req.protocol || "http";
  return `${protocol}://${hostname}:5173`;
}

function renderPage(serviceName, serviceDescription, appUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${serviceName} -- Nexus</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #14091E;
    font-family: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
    color: #EDE6F5;
    padding: 24px;
  }
  .card {
    background: #241733;
    border: 1px solid #3A2856;
    border-radius: 16px;
    padding: 40px;
    max-width: 480px;
    text-align: center;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #F87171;
    display: inline-block;
    margin-bottom: 16px;
  }
  h1 {
    font-size: 20px;
    margin: 0 0 12px;
    color: #fff;
  }
  p {
    font-size: 14px;
    line-height: 1.5;
    color: #B8A8CC;
    margin: 0 0 28px;
  }
  .btn {
    display: inline-block;
    background: linear-gradient(135deg, #9921FE, #BC6DFF);
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 24px;
    border-radius: 10px;
  }
  .btn:hover {
    background: linear-gradient(135deg, #7C18CC, #9921FE);
  }
  code {
    background: #2D1D40;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
</style>
</head>
<body>
  <div class="card">
    <span class="dot"></span>
    <h1>This is the ${serviceName}, not the app</h1>
    <p>${serviceDescription} Sorry for the confusion -- the Nexus app itself runs on port <code>5173</code>.</p>
    <a class="btn" id="app-link" href="${appUrl}">Go to the Nexus app &rarr;</a>
  </div>
  <script>
    // window.location always reflects the real address the browser is
    // showing -- unlike the Host header the backend receives, which
    // Codespaces' port-forwarding proxy rewrites to localhost:PORT.
    // Recompute the link here so it points at the actual public domain.
    (function () {
      var loc = window.location;
      var codespacesMatch = loc.hostname.match(/^(.*)-\\d+(\\.app\\.github\\.dev|\\.github\\.dev)$/);
      var url = codespacesMatch
        ? loc.protocol + "//" + codespacesMatch[1] + "-5173" + codespacesMatch[2]
        : loc.protocol + "//" + loc.hostname + ":5173";
      var link = document.getElementById("app-link");
      link.href = url;
      link.textContent = "Go to the Nexus app \\u2192";
    })();
  </script>
</body>
</html>`;
}

// Returns an Express handler that renders the themed "wrong port" page.
// Mount as the last route on a service's app, after all its real routes.
export function wrongPortFallback(serviceName, serviceDescription) {
  return function wrongPortHandler(req, res) {
    res.status(404).type("html").send(renderPage(serviceName, serviceDescription, resolveAppUrl(req)));
  };
}
