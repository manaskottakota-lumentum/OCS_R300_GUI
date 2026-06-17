import { useMemo, useState } from "react";
import { createInitialAppState, portNumber } from "./ocsModel.js";
import { MatrixPanel } from "./components/MatrixPanel.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { TopBar } from "./components/TopBar.jsx";

export default function App() {
  const initialState = useMemo(() => createInitialAppState(), []);
  const [appState, setAppState] = useState(initialState);

  const updateState = (patch) => {
    setAppState((current) => ({ ...current, ...patch }));
  };

  const snapshot = appState.mode === "live" ? appState.live : appState.draft;

  return (
    <div className="app-shell">
      <TopBar state={appState} onChange={updateState} />
      <Sidebar />
      <main className="main p-3">
        <section className="mb-3 flex flex-wrap items-center gap-3">
          <div className="mode-toggle inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
            <button
              className={`h-10 min-w-[98px] px-5 text-sm font-bold ${appState.mode === "live" ? "active" : ""}`}
              onClick={() => updateState({ mode: "live" })}
            >
              Live
            </button>
            <button
              className={`h-10 min-w-[116px] px-5 text-sm font-bold ${appState.mode === "draft" ? "active" : ""}`}
              onClick={() => updateState({ mode: "draft" })}
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
                if (number >= 1 && number <= 300) updateState({ centerPort: number });
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
            ["ti-refresh", "Get"],
            ["ti-plus", "Create"],
            ["ti-pencil", "Update"],
            ["ti-switch-3", "Replace"],
            ["ti-trash", "Delete"],
            ["ti-ban", "Block"],
            ["ti-circle-off", "Unblock"],
            ["ti-circle-check", "Validate"],
            ["ti-player-play", "Dry Run"],
          ].map(([icon, label]) => (
            <button key={label} className="toolbar-button">
              <span>
                <i className={`ti ${icon}`} />
                {label}
              </span>
            </button>
          ))}
          <button className="m-2 inline-flex h-[38px] min-w-[118px] items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700">
            <i className="ti ti-check text-xl" />
            Apply
          </button>
          <div className="mx-2 my-2 w-px border-l border-dashed border-slate-300" />
          {[
            ["ti-folder", "Import"],
            ["ti-upload", "Export"],
            ["ti-device-floppy", "Save Profile"],
            ["ti-folder-up", "Load Profile"],
            ["ti-history", "Rollback"],
          ].map(([icon, label]) => (
            <button key={label} className="toolbar-button">
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
            onSelect={(selected) => updateState({ selected })}
            onCenter={(centerPort) => updateState({ centerPort })}
            onToggleLabels={(event) => updateState({ showLabels: event.target.checked })}
            onToggleMinimap={(event) => updateState({ minimap: event.target.checked })}
            onZoom={(zoom) => updateState({ zoom })}
          />
          <aside className="module rounded-md p-6">
            <h2 className="text-lg font-black">Selected Connection</h2>
            <p className="mt-2 text-sm text-slate-600">
              Inspector panel will be ported next for {appState.selected.a} to {appState.selected.b}.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
