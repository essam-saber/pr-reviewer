import { generatePrompt } from "./prompts.js";
import { askLLM } from "./llm-client.js";
const testCases = [
  {
    name: "detects SQL injection vulnerability",
    diff: `diff --git a/src/users.js b/src/users.js
index 1234567..abcdefg 100644
--- a/src/users.js
+++ b/src/users.js
@@ -15,8 +15,12 @@ async function getUserByEmail(email) {
-  const result = await db.query("SELECT * FROM users WHERE email = '" + email + "'");
-  return result.rows[0];
+  const result = await db.query("SELECT * FROM users WHERE email = '" + email + "' AND active = 1");
+  if (result.rows.length === 0) {
+    return null;
+  }
+  return result.rows[0];
 }`,
    mustContain: [
      "SQL injection",
      "user input",
      "prepared statements",
      "parameterized",
      "sanitiz",
    ],
  },
  {
    name: "detects null check missing",
    diff: `diff --git a/src/orders.js b/src/orders.js
@@ -10,6 +10,10 @@ async function getOrderTotal(orderId) {
+  const order = await db.orders.findById(orderId);
+  const items = order.items.map(item => item.price * item.quantity);
+  return items.reduce((sum, price) => sum + price, 0);
+}`,
    mustContain: [
      "undefined check",
      "null check",
      "error handling",
      "optional chaining",
    ],
  },
  {
    name: "detects n+1 query issue",
    diff: `diff --git a/src/users.js b/src/users.js
@@ -5,8 +5,14 @@ async function listUsersWithPosts() {
+  const users = await db.users.findAll();
+  const result = [];
+  for (const user of users) {
+    const posts = await db.posts.findByUserId(user.id);
+    result.push({ ...user, posts });
+  }
+  return result;
+}`,
    mustContain: [
      "n+1",
      "query",
      "performance",
      "database",
      "optimize",
      "problem",
    ],
  },
  {
    name: "detects single responsibility violation",
    diff: `diff --git a/src/checkout.js b/src/checkout.js
@@ -1,4 +1,20 @@
+async function processCheckout(cart, user) {
+  const total = cart.items.reduce((sum, i) => sum + i.price, 0);
+  const tax = total * 0.15;
+  const finalTotal = total + tax;
+
+  await db.orders.create({ userId: user.id, total: finalTotal });
+
+  await emailService.send({
+    to: user.email,
+    subject: 'Order Confirmation',
+    body: \`Your total is \${finalTotal}\`,
+  });
+
+  await analytics.track('checkout', { userId: user.id, total: finalTotal });
+  await inventory.decrement(cart.items);
+
+  return finalTotal;
+}`,
    mustContain: [
      "single responsibility",
      "separation of concerns",
      "refactor",
      "srp",
      "splitting",
    ],
  },
  {
    name: "detects typo in function name",
    diff: `diff --git a/src/auth.js b/src/auth.js
@@ -1,5 +1,10 @@
+function authentcateUser(credntials) {
+  const usr = findUserByEmail(credntials.email);
+  if (!usr) return null;
+  return verifyPasword(usr, credntials.password);
+}`,
    mustContain: [
      "typo",
      "misspelling",
      "function name",
      "renamed",
      "naming",
      "spelling",
    ],
  },
  {
    name: "detects inconssistent return type",
    diff: `diff --git a/src/products.js b/src/products.js
@@ -1,5 +1,15 @@
+async function findProduct(id) {
+  const product = await db.products.findById(id);
+  if (!product) {
+    return false;
+  }
+  if (product.deleted) {
+    return null;
+  }
+  if (product.outOfStock) {
+    return 'unavailable';
+  }
+  return product;
+}`,
    mustContain: [
      "inconsistent return type",
      "mixed types",
      "return type",
      "return null",
      "return false",
      "return string",
    ],
  },
  {
    name: "detects database query outside repository layer",
    diff: `diff --git a/src/controllers/userController.js b/src/controllers/userController.js
@@ -1,5 +1,12 @@
+import { db } from '../db.js';
+
+export async function getUserProfile(req, res) {
+  const userId = req.params.id;
+  const user = await db.query(
+    'SELECT id, name, email, created_at FROM users WHERE id = $1',
+    [userId]
+  );
+  res.json(user.rows[0]);
+}`,
    mustContain: [
      "database query",
      "repository layer",
      "separation of concerns",
      "data access",
      "service layer",
    ],
  },
  {
    name: "detects deeply nested conditional",
    diff: `diff --git a/src/permissions.js b/src/permissions.js
@@ -1,4 +1,22 @@
+function canEditPost(user, post) {
+  if (user) {
+    if (user.active) {
+      if (post) {
+        if (post.published) {
+          if (user.id === post.authorId) {
+            return true;
+          } else {
+            if (user.role === 'admin') {
+              return true;
+            } else {
+              return false;
+            }
+          }
+        }
+      }
+    }
+  }
+  return false;
+}`,
    mustContain: [
      "deeply nested",
      "conditional",
      "refactor",
      "simplify",
      "early return",
    ],
  },
  {
    name: "detects long functions",
    diff: `diff --git a/src/report.js b/src/report.js
@@ -1,4 +1,50 @@
+async function generateMonthlyReport(userId, month, year) {
+  const user = await db.users.findById(userId);
+  const startDate = new Date(year, month - 1, 1);
+  const endDate = new Date(year, month, 0);
+
+  const orders = await db.orders.findByUser(userId, startDate, endDate);
+  let totalSpent = 0;
+  let itemsCount = 0;
+  const categoryBreakdown = {};
+
+  for (const order of orders) {
+    totalSpent += order.total;
+    for (const item of order.items) {
+      itemsCount += item.quantity;
+      if (!categoryBreakdown[item.category]) {
+        categoryBreakdown[item.category] = 0;
+      }
+      categoryBreakdown[item.category] += item.quantity;
+    }
+  }
+
+  const refunds = await db.refunds.findByUser(userId, startDate, endDate);
+  let totalRefunded = 0;
+  for (const refund of refunds) {
+    totalRefunded += refund.amount;
+  }
+
+  const netSpent = totalSpent - totalRefunded;
+  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
+
+  const reportHtml = \`
+    <h1>Monthly Report for \${user.name}</h1>
+    <p>Total spent: \${totalSpent}</p>
+    <p>Refunded: \${totalRefunded}</p>
+    <p>Net: \${netSpent}</p>
+    <p>Orders: \${orders.length}</p>
+    <p>Items: \${itemsCount}</p>
+  \`;
+
+  await emailService.send({
+    to: user.email,
+    subject: \`Report for \${month}/\${year}\`,
+    html: reportHtml,
+  });
+
+  await db.reports.create({ userId, month, year, totalSpent, totalRefunded });
+  return { reportHtml, totalSpent, netSpent };
+}`,
    mustContain: [
      "long function",
      "refactor",
      "extract functions",
      "single responsibility",
    ],
  },
  {
    name: "detects hardcoded secrets",
    diff: `diff --git a/src/email-service.js b/src/email-service.js
@@ -1,5 +1,15 @@
+import sgMail from '@sendgrid/mail';
+
+sgMail.setApiKey('SG.aB3xK9pLqM2nR7vT4wXyZ.fGhJkLmNoPqRsTuVwXyZ1234567890abcdef');
+
+export async function sendWelcomeEmail(user) {
+  await sgMail.send({
+    to: user.email,
+    from: 'noreply@example.com',
+    subject: 'Welcome',
+    text: \`Hi \${user.name}, welcome!\`,
+  });
+}`,
    mustContain: [
      "hardcoded secrets",
      "environment variables",
      "configuration",
      "security",
      "api key",
    ],
  },
];
const testCasesResults = [];
for (const testCase of testCases) {
  const { systemRole, userRole } = generatePrompt(testCase.diff);

  const review = await askLLM(systemRole, userRole);

  const reviewText = JSON.stringify(review).toLowerCase();

  const passed = testCase.mustContain.some((keyword) =>
    reviewText.includes(keyword.toLowerCase()),
  );
  console.log("Generated review:", review);
  console.log(passed ? `✓ ${testCase.name}` : `✗ ${testCase.name}`);
  testCasesResults.push({ testCase, review, passed });
}
console.log(testCasesResults);
