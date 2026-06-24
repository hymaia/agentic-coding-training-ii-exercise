export type WorkspaceName =
  | "packages/web"
  | "packages/ui"
  | "packages/catalog"
  | "packages/checkout"
  | "packages/search"
  | "packages/auth"
  | "apps/admin"
  | "apps/storefront"
  | "apps/seller-portal";

export type Workspace = {
  name: WorkspaceName;
  pathPrefix: `${WorkspaceName}/`;
  dependsOn: WorkspaceName[];
  testTarget: string;
};

export type Impact = {
  package: WorkspaceName;
  reason: string;
  testTargets: string[];
};

export type ImpactResult = {
  changedPath: string;
  directWorkspace?: WorkspaceName;
  impactedPackages: Impact[];
  testTargets: string[];
};

export const syntheticMarketplaceWorkspaces: Workspace[] = [
  {
    name: "packages/web",
    pathPrefix: "packages/web/",
    dependsOn: ["packages/ui", "packages/catalog", "packages/search", "packages/auth"],
    testTarget: "npm --workspace packages/web test",
  },
  {
    name: "packages/ui",
    pathPrefix: "packages/ui/",
    dependsOn: [],
    testTarget: "npm --workspace packages/ui test",
  },
  {
    name: "packages/catalog",
    pathPrefix: "packages/catalog/",
    dependsOn: [],
    testTarget: "npm --workspace packages/catalog test",
  },
  {
    name: "packages/checkout",
    pathPrefix: "packages/checkout/",
    dependsOn: ["packages/catalog", "packages/auth"],
    testTarget: "npm --workspace packages/checkout test",
  },
  {
    name: "packages/search",
    pathPrefix: "packages/search/",
    dependsOn: ["packages/catalog"],
    testTarget: "npm --workspace packages/search test",
  },
  {
    name: "packages/auth",
    pathPrefix: "packages/auth/",
    dependsOn: [],
    testTarget: "npm --workspace packages/auth test",
  },
  {
    name: "apps/admin",
    pathPrefix: "apps/admin/",
    dependsOn: ["packages/ui", "packages/catalog", "packages/auth"],
    testTarget: "npm --workspace apps/admin test",
  },
  {
    name: "apps/storefront",
    pathPrefix: "apps/storefront/",
    dependsOn: [
      "packages/web",
      "packages/ui",
      "packages/catalog",
      "packages/checkout",
      "packages/search",
      "packages/auth",
    ],
    testTarget: "npm --workspace apps/storefront test",
  },
  {
    name: "apps/seller-portal",
    pathPrefix: "apps/seller-portal/",
    dependsOn: ["packages/ui", "packages/catalog", "packages/auth"],
    testTarget: "npm --workspace apps/seller-portal test",
  },
];

export function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.?\//, "");
}

export function findDirectWorkspace(path: string): Workspace | undefined {
  const changedPath = normalizePath(path);
  return syntheticMarketplaceWorkspaces.find((ws) => changedPath.startsWith(ws.pathPrefix));
}

export function isWorkspaceSensitivePath(path: string): boolean {
  return findDirectWorkspace(path) !== undefined;
}

export function computeWorkspaceImpact(path: string): ImpactResult {
  const changedPath = normalizePath(path);
  const direct = findDirectWorkspace(changedPath);

  if (!direct) {
    return { changedPath, impactedPackages: [], testTargets: [] };
  }

  const impacts: Impact[] = [];
  const seenTests = new Set<string>();

  const addImpact = (ws: Workspace, reason: string) => {
    impacts.push({ package: ws.name, reason, testTargets: [ws.testTarget] });
    seenTests.add(ws.testTarget);
  };

  addImpact(direct, "directly edited");

  for (const ws of syntheticMarketplaceWorkspaces) {
    if (ws.dependsOn.includes(direct.name)) {
      addImpact(ws, `depends on ${direct.name}`);
    }
  }

  for (const depName of direct.dependsOn) {
    const dep = syntheticMarketplaceWorkspaces.find((ws) => ws.name === depName);
    if (dep && !impacts.find((i) => i.package === dep.name)) {
      addImpact(dep, `integration boundary: dependency of ${direct.name}`);
    }
  }

  return {
    changedPath,
    directWorkspace: direct.name,
    impactedPackages: impacts,
    testTargets: [...seenTests],
  };
}

export function buildHookContext(path: string): string | undefined {
  const filePath = normalizePath(path);
  if (!isWorkspaceSensitivePath(filePath)) return undefined;
  return `Call mcp__repo__affected_packages with {"path":"${filePath}"} before selecting validation commands.`;
}
