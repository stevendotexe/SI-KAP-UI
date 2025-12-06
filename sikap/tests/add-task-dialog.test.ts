import assert from "node:assert";
import { sanitizeHtml, containsDangerousHtml } from "@/lib/sanitize-html";

function testSanitizeRemovesScript() {
  const unsafe = '<script>alert("x")</script><p>Halo</p>';
  const safe = sanitizeHtml(unsafe);
  assert.strictEqual(containsDangerousHtml(unsafe), true);
  assert.strictEqual(containsDangerousHtml(safe), false);
  assert.ok(safe.includes("<p>Halo</p>"));
  console.log("✓ testSanitizeRemovesScript passed");
}

function testSanitizeKeepsAllowedTags() {
  const input = '<b>Bold</b> <i>Italic</i> <u>Underline</u>';
  const out = sanitizeHtml(input);
  assert.ok(out.includes("<b>Bold</b>"));
  assert.ok(out.includes("<i>Italic</i>"));
  assert.ok(out.includes("<u>Underline</u>"));
  console.log("✓ testSanitizeKeepsAllowedTags passed");
}

function run() {
  testSanitizeRemovesScript();
  testSanitizeKeepsAllowedTags();
}

run();

