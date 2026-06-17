import { useMemo, useState } from "react";
import {
  buildInitialSnapshot,
  clone,
  createAuditEntry,
  createInitialAppState,
  makeConnection,
  nextFreePort,
  portNumber,
  summarizeChanges,
  updatePortStatuses,
  validateSnapshot,
} from "../ocsModel.js";

export function useOcsDashboard() {
  const initialState = useMemo(() => createInitialAppState(), []);
  const [state, setState] = useState(initialState);
  const [toast, setToast] = useState(null);

  const notify = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(null), 3200);
  };

  const patch = (update) => {
    setState((current) => (typeof update === "function" ? update(current) : { ...current, ...update }));
  };

  const log = (action, target = "Draft Plan", details = "", result = "Success") => {
    setState((current) => ({
      ...current,
      logs: [createAuditEntry(action, target, details, result), ...current.logs].slice(0, 256),
    }));
  };

  const ensureDraftMode = () => {
    setState((current) => (current.mode === "draft" ? current : { ...current, mode: "draft" }));
  };

  const currentSnapshot = state.mode === "live" ? state.live : state.draft;

  const getConnections = () => {
    patch((current) => ({
      ...current,
      connected: true,
      draft: clone(current.live),
      mode: "draft",
      dryRun: { passed: false, count: 0 },
    }));
    log("Get Connections", state.target, "Pulled live cross-connect data via gNMI", "Success");
    notify("Live connections refreshed into Draft Plan.");
  };

  const createConnection = () => {
    ensureDraftMode();
    patch((current) => {
      const a = nextFreePort(current.draft, "A");
      const b = nextFreePort(current.draft, "B");
      const connection = makeConnection(a, b, "tuned", `Core_${a}`);
      const draft = updatePortStatuses({
        ...current.draft,
        connections: [...current.draft.connections, connection],
      });

      return {
        ...current,
        draft,
        selected: { a, b },
        centerPort: portNumber(a),
        dryRun: { passed: false, count: 0 },
      };
    });
    log("Create Connection", "Next Free Ports", "Added draft cross-connect", "Success");
    notify("Created a draft connection on the next free A/B ports.");
  };

  const updateSelectedConnection = () => {
    ensureDraftMode();
    patch((current) => ({
      ...current,
      draft: updatePortStatuses({
        ...current.draft,
        connections: current.draft.connections.map((connection) =>
          connection.a === current.selected.a || connection.b === current.selected.b
            ? { ...connection, status: connection.status === "tuned" ? "disconnected" : "tuned", updatedAt: new Date().toISOString() }
            : connection,
        ),
      }),
      dryRun: { passed: false, count: 0 },
    }));
    log("Update Connection", `${state.selected.a} -> ${state.selected.b}`, "Toggled simulated connection state", "Success");
    notify("Selected connection updated in Draft Plan.");
  };

  const replaceDraft = () => {
    if (!window.confirm("Replace the current draft with a regenerated 248-connection baseline?")) return;
    const baseline = buildInitialSnapshot();
    patch({
      draft: clone(baseline),
      selected: { a: "A-131", b: "B-131" },
      centerPort: 131,
      mode: "draft",
      dryRun: { passed: false, count: 0 },
    });
    log("Replace Draft Matrix", "Draft Plan", "Regenerated baseline connections", "Success");
    notify("Draft matrix replaced with a fresh baseline.");
  };

  const deleteSelected = () => {
    ensureDraftMode();
    patch((current) => {
      const remaining = current.draft.connections.filter(
        (connection) => connection.a !== current.selected.a && connection.b !== current.selected.b,
      );
      const fallback = remaining[0] || makeConnection("A-1", "B-1");

      return {
        ...current,
        draft: updatePortStatuses({ ...current.draft, connections: remaining }),
        selected: { a: fallback.a, b: fallback.b },
        centerPort: portNumber(fallback.a),
        dryRun: { passed: false, count: 0 },
      };
    });
    log("Delete Connection", `${state.selected.a} -> ${state.selected.b}`, "Removed from draft plan", "Success");
    notify("Selected connection deleted from Draft Plan.");
  };

  const setSelectedBlocked = (blocked) => {
    ensureDraftMode();
    patch((current) => {
      const ports = [current.selected.a, current.selected.b];
      const portsState = clone(current.draft.ports);
      ports.forEach((port) => {
        portsState[port] = { ...portsState[port], blocked, status: blocked ? "blocked" : "available" };
      });

      return {
        ...current,
        draft: updatePortStatuses({
          ...current.draft,
          ports: portsState,
          connections: current.draft.connections.map((connection) =>
            connection.a === current.selected.a || connection.b === current.selected.b
              ? { ...connection, status: blocked ? "blocked" : "tuned" }
              : connection,
          ),
        }),
        dryRun: { passed: false, count: 0 },
      };
    });
    log(blocked ? "Block Port" : "Unblock Port", `${state.selected.a}, ${state.selected.b}`, blocked ? "Port manually blocked" : "Port unblocked", blocked ? "Warning" : "Success");
    notify(blocked ? "Selected ports blocked." : "Selected ports unblocked.", blocked ? "warn" : "success");
  };

  const validatePlan = () => {
    const findings = validateSnapshot(state.draft);
    const errors = findings.filter((finding) => finding.severity === "error");
    log("Validate Plan", "Draft Plan", `${findings.length} findings`, errors.length ? "Failed" : "Passed");
    notify(errors.length ? "Validation found blocking errors." : "Validation passed.", errors.length ? "error" : "success");
  };

  const dryRun = () => {
    const findings = validateSnapshot(state.draft);
    const errors = findings.filter((finding) => finding.severity === "error");

    if (errors.length) {
      patch({ dryRun: { passed: false, count: 0 } });
      log("Dry Run Validation", "Draft Plan", `${errors.length} blocking errors`, "Failed");
      notify("Dry run failed. Resolve validation errors.", "error");
      return;
    }

    const count = summarizeChanges(state.live, state.draft);
    patch({ dryRun: { passed: true, count } });
    log("Dry Run Validation", "Draft Plan", `${count} changes validated`, "Passed");
    notify("Dry run passed.");
  };

  const applyChanges = () => {
    const errors = validateSnapshot(state.draft).filter((finding) => finding.severity === "error");
    if (errors.length) {
      log("Apply Changes", "Draft Plan", `${errors.length} errors blocked apply`, "Failed");
      notify("Cannot apply while validation errors exist.", "error");
      return;
    }

    patch((current) => ({
      ...current,
      previousGood: clone(current.live),
      live: clone(current.draft),
      mode: "live",
      dryRun: { passed: false, count: 0 },
    }));
    log("Apply Changes", "Draft Plan", `${state.draft.connections.length} connections applied`, "Success");
    notify("Draft changes applied to simulated live hardware.");
  };

  const saveProfile = () => {
    const name = window.prompt("Profile name", `OCS Profile ${state.profiles.length + 1}`);
    if (!name) return;

    patch((current) => ({
      ...current,
      profiles: [{ name, snapshot: clone(currentSnapshot), createdAt: new Date().toISOString() }, ...current.profiles],
    }));
    log("Profile Saved", name, `Saved ${currentSnapshot.connections.length} connections`, "Success");
    notify("Profile saved.");
  };

  const loadProfile = () => {
    const profile = state.profiles[0];
    if (!profile) return;
    const first = profile.snapshot.connections[0];
    patch({
      draft: clone(profile.snapshot),
      selected: { a: first.a, b: first.b },
      centerPort: portNumber(first.a),
      mode: "draft",
      dryRun: { passed: false, count: 0 },
    });
    log("Load Profile", profile.name, "Restored into Draft Plan", "Success");
    notify("Profile loaded into Draft Plan.");
  };

  const rollback = () => {
    const first = state.previousGood.connections.find((connection) => connection.a === "A-131") || state.previousGood.connections[0];
    patch({
      live: clone(state.previousGood),
      draft: clone(state.previousGood),
      selected: { a: first.a, b: first.b },
      centerPort: portNumber(first.a),
      mode: "live",
      dryRun: { passed: false, count: 0 },
    });
    log("Rollback", "Last Known Good", "Live state reverted to previous known-good", "Success");
    notify("Rollback completed.");
  };

  const updateSelectedLabel = (label) => {
    patch((current) => ({
      ...current,
      mode: "draft",
      draft: {
        ...current.draft,
        connections: current.draft.connections.map((connection) =>
          connection.a === current.selected.a || connection.b === current.selected.b
            ? { ...connection, label, updatedAt: new Date().toISOString() }
            : connection,
        ),
      },
      dryRun: { passed: false, count: 0 },
    }));
  };

  const showValidationDetails = () => {
    const findings = validateSnapshot(state.draft);
    if (!findings.length) {
      window.alert("No validation findings.");
      return;
    }
    window.alert(findings.map((finding) => `${finding.title}: ${finding.detail}`).join("\n\n"));
  };

  const previewRollback = () => {
    window.alert(`Rollback target: Last Known Good\nConnections: ${state.previousGood.connections.length}`);
  };

  return {
    state,
    snapshot: currentSnapshot,
    toast,
    patch,
    actions: {
      getConnections,
      createConnection,
      updateSelectedConnection,
      replaceDraft,
      deleteSelected,
      blockSelected: () => setSelectedBlocked(true),
      unblockSelected: () => setSelectedBlocked(false),
      validatePlan,
      dryRun,
      applyChanges,
      saveProfile,
      loadProfile,
      rollback,
      updateSelectedLabel,
      showValidationDetails,
      previewRollback,
    },
  };
}
