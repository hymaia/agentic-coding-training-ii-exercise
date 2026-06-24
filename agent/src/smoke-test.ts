import {
  buildHookContext,
  computeWorkspaceImpact,
  syntheticMarketplaceWorkspaces,
} from "./marketplace-impact.js";

const sampleEdits = [
  "packages/web/src/pages/product.tsx",
  "packages/ui/src/components/PriceBadge.tsx",
  "packages/catalog/src/product-card.ts",
  "apps/admin/src/routes/products.tsx",
  "docs/architecture.md",
];

console.log("Synthetic marketplace workspaces:");
for (const workspace of syntheticMarketplaceWorkspaces) {
  console.log(`- ${workspace.name} depends on ${workspace.dependsOn.join(", ") || "nothing"}`);
}

for (const path of sampleEdits) {
  const hookContext = buildHookContext(path);
  const impact = computeWorkspaceImpact(path);

  console.log("\n---");
  console.log(`Edit|Write: ${path}`);
  console.log(`hook context: ${hookContext ?? "<none>"}`);
  console.log("mcp__repo__affected_packages structuredContent:");
  console.log(JSON.stringify(impact, null, 2));
}
