/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createType("job_status", ["pending", "processing", "reviewed", "failed"]);
  pgm.createTable("pr_review_jobs", {
    id: "id",
    github_pr_id: { type: "bigint", notNull: true },
    owner: { type: "text", notNull: true },
    repo: { type: "text", notNull: true },
    pr_number: { type: "integer", notNull: true },
    status: { type: "job_status", notNull: true, default: "pending" },
    diff_hash: { type: "text", notNull: true },
    review_text: { type: "text", notNull: false },
    github_comment_id: { type: "bigint", notNull: false },
    retries: { type: "integer", notNull: true, default: 0 },
    next_attempt_at: { type: "timestamptz", notNull: false },
    last_error: { type: "text", notNull: false },
    locked_at: { type: "timestamptz", notNull: false },
    reviewed_at: { type: "timestamptz", notNull: false },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("pr_review_jobs", "status");
  pgm.createIndex("pr_review_jobs", ["github_pr_id", "diff_hash"]);
  pgm.createIndex("pr_review_jobs", "github_pr_id", {
    unique: true,
    where: "status IN ('pending', 'processing')",
    name: "one_active_job_per_pr",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable("pr_review_jobs");
    pgm.dropType("job_status");
};
