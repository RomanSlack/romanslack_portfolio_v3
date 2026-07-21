import { next, rewrite } from "@vercel/edge";

// Root-path markdown negotiation. A vercel.json rewrite cannot do this for "/"
// because the filesystem (index.html) takes precedence over rewrites at the
// root. Middleware runs before the filesystem, so it can serve the markdown
// twin to agents that ask for it while browsers still get HTML.
export const config = { matcher: "/" };

export default function middleware(req: Request) {
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/markdown")) {
    return rewrite(new URL("/index.md", req.url));
  }
  return next();
}
