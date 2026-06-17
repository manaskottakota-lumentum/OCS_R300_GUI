import { portNumber } from "./ocsModel.js";
import { InspectorPanel } from "./components/InspectorPanel.jsx";
import { MatrixPanel } from "./components/MatrixPanel.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { TopBar } from "./components/TopBar.jsx";
import { Toast } from "./components/Toast.jsx";
import { useOcsDashboard } from "./hooks/useOcsDashboard.js";
import { OnboardingPanel, TroubleshootingPanel, WorkflowPanel } from "./components/WorkflowPanel.jsx";

export default function App() {
  const { state: appState, snapshot, toast, patch, actions } = useOcsDashboard();

  return (
    <div className="app-shell">
      <TopBar state={appState} onChange={patch} />
      <Sidebar />
      <main className="main p-3">
        <section className="mb-3 flex flex-wrap items-center gap-3">
          <div className="mode-toggle inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
            <button
              className={`h-10 min-w-[98px] px-5 text-sm font-bold ${appState.mode === "live" ? "active" : ""}`}
              onClick={() => patch({ mode: "live" })}
            >
              Live
            </button>
            <button
              className={`h-10 min-w-[116px] px-5 text-sm font-bold ${appState.mode === "draft" ? "active" : ""}`}
              onClick={() => patch({ mode: "draft" })}
            >
              Draft Plan
            </button>
          </div>

          <div className="ml-auto flex min-w-[320px] max-w-[470px] flex-1 items-center rounded-md border border-slate-300 bg-white px-3 shadow-sm">
            <input
              className="h-10 min-w-0 flex-1 text-sm outline-none"
              placeholder="Search ports (A-1, B-1, label...)"
              onChange={(event) => {
                const number = portNumber(event.target.value);
                if (number >= 1 && number <= 300) patch({ centerPort: number });
              }}
            />
            <i className="ti ti-search text-xl text-slate-700" />
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold shadow-sm hover:bg-slate-50">
            <i className="ti ti-filter text-lg" />
            Filters
            <i className="ti ti-chevron-down" />
          </button>
        </section>

        <section className="mb-3 flex flex-wrap overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
          {[
            ["ti-refresh", "Get", actions.getConnections],
            ["ti-plus", "Create", actions.createConnection],
            ["ti-pencil", "Update", actions.updateSelectedConnection],
            ["ti-switch-3", "Replace", actions.replaceDraft],
            ["ti-trash", "Delete", actions.deleteSelected],
            ["ti-ban", "Block", actions.blockSelected],
            ["ti-circle-off", "Unblock", actions.unblockSelected],
            ["ti-circle-check", "Validate", actions.validatePlan],
            ["ti-player-play", "Dry Run", actions.dryRun],
          ].map(([icon, label, onClick]) => (
            <button key={label} className="toolbar-button" onClick={onClick}>
              <span>
                <i className={`ti ${icon}`} />
                {label}
              </span>
            </button>
          ))}
          <button
            className="m-2 inline-flex h-[38px] min-w-[118px] items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700"
            onClick={actions.applyChanges}
          >
            <i className="ti ti-check text-xl" />
            Apply
          </button>
          <div className="mx-2 my-2 w-px border-l border-dashed border-slate-300" />
          {[
            ["ti-folder", "Import", actions.getConnections],
            ["ti-upload", "Export", () => window.alert("Export will move to backend/download handling later.")],
            ["ti-device-floppy", "Save Profile", actions.saveProfile],
            ["ti-folder-up", "Load Profile", actions.loadProfile],
            ["ti-history", "Rollback", actions.rollback],
          ].map(([icon, label, onClick]) => (
            <button key={label} className="toolbar-button" onClick={onClick}>
              <span>
                <i className={`ti ${icon}`} />
                {label}
              </span>
            </button>
          ))}
        </section>

        <div className="content-grid grid grid-cols-[minmax(690px,1fr)_420px] gap-3">
          <MatrixPanel
            state={appState}
            snapshot={snapshot}
            onSelect={(selected) => patch({ selected })}
            onCenter={(centerPort) => patch({ centerPort })}
            onToggleLabels={(event) => patch({ showLabels: event.target.checked })}
            onToggleMinimap={(event) => patch({ minimap: event.target.checked })}
            onZoom={(zoom) => patch({ zoom })}
          />
          <InspectorPanel
            state={appState}
            snapshot={snapshot}
            onUpdateSelectedLabel={actions.updateSelectedLabel}
            onSaveProfile={actions.saveProfile}
            onLoadProfile={actions.loadProfile}
            onRollback={actions.rollback}
            onPreviewRollback={actions.previewRollback}
            onShowValidation={actions.showValidationDetails}
          />
        </div>
        {appState.dryRun.passed && (
          <div className="mx-4 mt-3 flex items-center gap-3 rounded-md border border-green-300 bg-green-50 px-4 py-3">
            <i className="ti ti-circle-check-filled text-2xl text-green-600" />
            <div className="mr-auto text-base font-black">Dry run passed: {appState.dryRun.count} changes ready to apply</div>
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700" onClick={actions.applyChanges}>
              <i className="ti ti-check" />
              Apply
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold hover:bg-slate-50" onClick={() => patch({ dryRun: { passed: false, count: 0 } })}>
              <i className="ti ti-x" />
              Cancel
            </button>
          </div>
        )}
        <div className="lower-grid mt-3 grid grid-cols-[minmax(620px,1fr)_280px_330px] gap-3">
          <WorkflowPanel state={appState} patch={patch} />
          <OnboardingPanel state={appState} patch={patch} />
          <TroubleshootingPanel />
        </div>
      </main>
      <Toast toast={toast} />
    </div>
  );
}
