import crypto from "crypto";
import "dotenv/config";
import Fastify from "fastify";
import { query } from "./db.js";

function verifySignature(request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const signature = request.headers["x-hub-signature-256"];
  const payload = request.rawBody;

  if (!signature || !payload) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest("hex")}`;

  try {
    const receivedSignature = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    if (receivedSignature.length !== expectedSignatureBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(receivedSignature, expectedSignatureBuffer);
  } catch (err) {
    return false;
  }
}

function isReviewableRequest(request) {
  const event = request.headers["x-github-event"];
  const action = request.body.action;

  const isPullRequest = event === "pull_request";
  const isReviewableAction = action === "opened" || action === "synchronize";

  return isPullRequest && isReviewableAction;
}

const fastify = Fastify({
  logger: true,
});

fastify.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  (req, body, done) => {
    req.rawBody = body;
    try {
      const parsed = JSON.parse(body);
      done(null, parsed);
    } catch (err) {
      done(err);
    }
  },
);

fastify.post("/webhook", async (request, reply) => {
  if (!verifySignature(request)) {
    request.log.warn("Invalid signature for incoming webhook");
    return reply.status(401).send({ error: "Invalid signature" });
  }

  if (!isReviewableRequest(request)) {
    request.log.info(
      {
        action: request.body.action,
      },
      "Received non-reviewable event, ignoring",
    );
    return reply.status(200).send({ status: "ignored" });
  }

  try {
    await query(
      "INSERT INTO pr_review_jobs (github_pr_id, owner, repo, pr_number, head_sha, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (github_pr_id) WHERE status IN ('pending', 'processing') DO NOTHING",
      [
        request.body.pull_request.id,
        request.body.repository.owner.login,
        request.body.repository.name,
        request.body.pull_request.number,
        request.body.pull_request.head.sha,
        "pending",
      ],
    );
    request.log.info({ pr: request.body.pull_request.number }, "Job enqueued");
    return { status: "OK" };
  } catch (err) {
    request.log.error({ err }, "Failed to enqueue job");
    return reply.status(500).send({ error: "Failed to enqueue" });
  }
});

try {
  await fastify.listen({ port: 3000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
