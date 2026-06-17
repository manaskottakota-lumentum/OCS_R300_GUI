export const PORT_COUNT = 300;
export const VISIBLE_COUNT = 10;
export const ROW_HEIGHT = 31;

export const STATUS_LABELS = {
  tuned: "Tuned",
  blocked: "Blocked",
  failed: "Failed",
  disconnected: "Disconnected",
  available: "Available",
};

export const STATUS_COLORS = {
  tuned: "#16a34a",
  blocked: "#f59e0b",
  failed: "#ef4444",
  disconnected: "#64748b",
  available: "#a0aab6",
};

export const TROUBLESHOOTING_CARDS = [
  {
    title: "Invalid Port ID",
    detail: "Port ID must be in range A-1..A-300 or B-1..B-300",
    severity: "error",
    icon: "ti-alert-circle",
  },
  {
    title: "Port Group Mismatch",
    detail: "A-side ports cannot connect to A-side ports",
    severity: "warn",
    icon: "ti-alert-triangle",
  },
  {
    title: "Duplicate Connection",
    detail: "A-side or B-side ports can only be used once per plan",
    severity: "error",
    icon: "ti-alert-circle",
  },
  {
    title: "Port Blocked",
    detail: "Administratively blocked ports cannot be applied until unblocked",
    severity: "warn",
    icon: "ti-alert-triangle",
  },
];

export const WORKFLOW_TABS = [
  { id: "ztp", label: "ZTP" },
  { id: "upgrade", label: "Upgrade" },
  { id: "certs", label: "Certificates" },
  { id: "ntp", label: "NTP/DNS" },
  { id: "acl", label: "ACL" },
  { id: "telemetry", label: "Telemetry" },
  { id: "audit", label: "Audit Log" },
];

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function makeUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function normalizePort(value, side) {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(/^([AB])-?(\d{1,3})$/);
  if (!match) return "";

  const prefix = match[1];
  const number = Number(match[2]);
  if ((side && prefix !== side) || number < 1 || number > PORT_COUNT) return "";

  return `${prefix}-${number}`;
}

export function portNumber(port) {
  const match = String(port || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function hvdac(port) {
  const number = portNumber(port);
  const slot = Math.max(1, Math.ceil(number / 48));
  const portInSlot = ((number - 1) % 48) + 1;
  return `Slot ${slot} / Port ${portInSlot}`;
}

export function makeConnection(a, b, status = "tuned", label = "") {
  const aPort = normalizePort(a, "A");
  const bPort = normalizePort(b, "B");

  return {
    id: makeUuid(),
    a: aPort,
    b: bPort,
    status,
    label: label || `Core_${aPort || "A-?"}`,
    createdBy: "admin",
    hvdacA: aPort ? hvdac(aPort) : "",
    hvdacB: bPort ? hvdac(bPort) : "",
    updatedAt: new Date().toISOString(),
  };
}

export function buildInitialSnapshot() {
  const connections = [
    makeConnection("A-127", "B-133", "available", "Spare_A127"),
    makeConnection("A-128", "B-132", "available", "Spare_A128"),
    makeConnection("A-129", "B-129", "tuned", "Core_A129"),
    makeConnection("A-130", "B-128", "available", "Metro_A130"),
    makeConnection("A-131", "B-131", "tuned", "Core_A131"),
    makeConnection("A-132", "B-127", "available", "Spare_A132"),
    makeConnection("A-133", "B-130", "tuned", "Core_A133"),
    makeConnection("A-134", "B-134", "failed", "Fault_A134"),
    makeConnection("A-300", "B-300", "available", "Lab_A300"),
  ];

  for (let i = 1; i <= 248; i += 1) {
    const a = `A-${i}`;
    const b = `B-${i}`;
    if (!connections.some((connection) => connection.a === a || connection.b === b)) {
      const status = i % 91 === 0 ? "blocked" : i % 63 === 0 ? "disconnected" : "tuned";
      connections.push(makeConnection(a, b, status, `Fabric_${String(i).padStart(3, "0")}`));
    }
  }

  const ports = {};
  for (let i = 1; i <= PORT_COUNT; i += 1) {
    ports[`A-${i}`] = { status: "available", blocked: false, label: `A-${i}` };
    ports[`B-${i}`] = { status: "available", blocked: false, label: `B-${i}` };
  }

  connections.forEach((connection) => {
    if (connection.a) ports[connection.a].status = connection.status;
    if (connection.b) ports[connection.b].status = connection.status;
  });

  ["A-142", "B-142", "A-207"].forEach((port) => {
    ports[port].status = "blocked";
    ports[port].blocked = true;
  });

  return { connections, ports, savedAt: new Date().toISOString() };
}

export function updatePortStatuses(snapshot) {
  const next = clone(snapshot);

  Object.keys(next.ports).forEach((port) => {
    if (!next.ports[port].blocked) next.ports[port].status = "available";
  });

  next.connections.forEach((connection) => {
    if (next.ports[connection.a] && !next.ports[connection.a].blocked) {
      next.ports[connection.a].status = connection.status;
    }
    if (next.ports[connection.b] && !next.ports[connection.b].blocked) {
      next.ports[connection.b].status = connection.status;
    }
  });

  return next;
}

export function statusForPort(snapshot, port) {
  if (snapshot.ports[port]?.blocked) return "blocked";

  const connection = snapshot.connections.find((item) => item.a === port || item.b === port);
  return connection?.status || snapshot.ports[port]?.status || "available";
}

export function validateSnapshot(snapshot) {
  const findings = [];
  const seenA = new Map();
  const seenB = new Map();

  snapshot.connections.forEach((connection) => {
    const a = normalizePort(connection.a, "A");
    const b = normalizePort(connection.b, "B");

    if (!a || !b) {
      findings.push({
        severity: "error",
        title: "Invalid Port ID",
        detail: `${connection.a || "missing"} to ${connection.b || "missing"} must use A-1..A-300 and B-1..B-300.`,
      });
      return;
    }

    if (seenA.has(a)) {
      findings.push({
        severity: "error",
        title: "Duplicate A-Side Mapping",
        detail: `${a} is already connected to ${seenA.get(a)}.`,
      });
    }

    if (seenB.has(b)) {
      findings.push({
        severity: "error",
        title: "Duplicate Connection",
        detail: `${b} is already connected to ${seenB.get(b)}.`,
      });
    }

    seenA.set(a, b);
    seenB.set(b, a);

    if (snapshot.ports[a]?.blocked || snapshot.ports[b]?.blocked || connection.status === "blocked") {
      findings.push({
        severity: "warning",
        title: "Port Blocked",
        detail: `${a} or ${b} is administratively blocked.`,
      });
    }

    if (connection.status === "failed") {
      findings.push({
        severity: "warning",
        title: "Optical Fault",
        detail: `${a} to ${b} reports failed tuning.`,
      });
    }
  });

  return findings;
}

export function visibleNumbers(centerPort) {
  let start = Math.max(1, centerPort - Math.floor(VISIBLE_COUNT / 2));
  let end = Math.min(PORT_COUNT, start + VISIBLE_COUNT - 1);
  start = Math.max(1, end - VISIBLE_COUNT + 1);

  const numbers = [];
  for (let i = start; i <= end; i += 1) numbers.push(i);
  return numbers;
}

export function nextFreePort(snapshot, side) {
  const used = new Set(snapshot.connections.map((connection) => (side === "A" ? connection.a : connection.b)));

  for (let i = 1; i <= PORT_COUNT; i += 1) {
    const port = `${side}-${i}`;
    if (!used.has(port)) return port;
  }

  return `${side}-1`;
}

export function summarizeChanges(live, draft) {
  const liveMap = new Map(live.connections.map((connection) => [connection.a, connection.b]));
  const changedConnections = draft.connections.filter((connection) => liveMap.get(connection.a) !== connection.b);
  return changedConnections.length || draft.connections.length;
}

export function createAuditEntry(action, target = "Draft Plan", details = "", result = "Success") {
  return {
    id: makeUuid(),
    time: new Date().toISOString().replace("T", " ").slice(0, 19),
    user: "admin",
    action,
    target,
    details,
    result,
  };
}

export function buildSeedLogs() {
  return [
    createAuditEntry("Unblock Port", "A-142", "Port unblocked", "Success"),
    createAuditEntry("Block Port", "A-142", "Port manually blocked", "Warning"),
    createAuditEntry("Apply Changes", "Draft Plan", "248 changes applied", "Success"),
    createAuditEntry("Rollback Point Created", "Last Known Good", "Auto snapshot before apply", "Success"),
    createAuditEntry("Profile Saved", "AI Fabric Baseline", "Saved draft as profile", "Success"),
    createAuditEntry("Dry Run Validation", "Draft Plan", "248 changes validated", "Passed"),
    createAuditEntry("Import Plan", "plan_0617.csv", "248 connections, 12 port config updates", "Success"),
  ];
}

export function createInitialAppState() {
  const initialSnapshot = buildInitialSnapshot();

  return {
    mode: "draft",
    centerPort: 131,
    zoom: 100,
    showLabels: true,
    minimap: true,
    selected: { a: "A-131", b: "B-131" },
    connected: true,
    mtls: true,
    target: "10.13.186.94",
    grpcPort: "9339",
    role: "Admin",
    auditEnabled: true,
    dryRun: { passed: false, count: 0 },
    previousGood: clone(initialSnapshot),
    live: clone(initialSnapshot),
    draft: clone(initialSnapshot),
    activeTab: "audit",
    profiles: [
      { name: "AI Fabric Baseline", snapshot: clone(initialSnapshot), createdAt: new Date().toISOString() },
      { name: "Last Known Good", snapshot: clone(initialSnapshot), createdAt: new Date().toISOString() },
    ],
    telemetry: {
      opticalPower: [74, 76, 75, 78, 77, 81, 80, 82, 83, 81],
      latency: [12, 11, 13, 12, 14, 15, 12, 11, 12, 13],
      alarms: [2, 1, 1, 2, 0, 1, 1, 0, 1, 1],
    },
    ztpSteps: [
      { label: "Discover OCS R300", done: true },
      { label: "Fetch SONiC YANG schema", done: true },
      { label: "Verify gRPC connectivity", done: true },
      { label: "Import baseline plan", done: true },
      { label: "Validate draft plan", done: true },
      { label: "Provision certificates", done: true },
      { label: "Enable telemetry", done: false },
    ],
    onboarding: [
      { label: "Connect to OCS R300", done: true },
      { label: "Verify gRPC Connectivity", done: true },
      { label: "Import Baseline Plan", done: true },
      { label: "Validate Draft Plan", done: true },
      { label: "Save Profile", done: true },
      { label: "Configure mTLS", done: true },
      { label: "Configure NTP/DNS", done: true },
      { label: "Set ACL Rules", done: false },
      { label: "Create Rollback Point", done: false },
    ],
    certs: {
      ready: true,
      issuer: "OCS Fabric CA",
      expires: "2026-12-31 23:59 UTC",
      fingerprint: "5B:88:21:F4:79:AA:31:CE",
    },
    upgrade: {
      image: "sonic-ocs-r300-2.0.3.bin",
      stage: "Idle",
      progress: 0,
      installed: false,
      activated: false,
      verified: false,
    },
    ntpDns: {
      ntpPrimary: "time.google.com",
      ntpSecondary: "pool.ntp.org",
      dnsPrimary: "10.13.10.53",
      dnsSecondary: "10.13.10.54",
    },
    acl: [
      { id: 1, source: "10.13.0.0/16", protocol: "gNMI", action: "allow" },
      { id: 2, source: "10.20.42.0/24", protocol: "SSH", action: "allow" },
      { id: 3, source: "0.0.0.0/0", protocol: "gNOI", action: "deny" },
    ],
    logs: buildSeedLogs(),
  };
}
