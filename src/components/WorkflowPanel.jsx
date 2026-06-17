import { TROUBLESHOOTING_CARDS, WORKFLOW_TABS } from "../ocsModel.js";
import { Icon } from "./Icon.jsx";

function MetricCard({ title, unit, values, color }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 46 - ((value - min) / Math.max(1, max - min)) * 38;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke = color === "green" ? "#16a34a" : color === "red" ? "#ef4444" : "#2563eb";

  return (
    <div className="rounded-md border border-slate-300 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-black">{title}</div>
          <div className="mt-1 text-2xl font-black">
            {values.at(-1)} <span className="text-sm text-slate-500">{unit}</span>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">live</span>
      </div>
      <svg className="sparkline" viewBox="0 0 100 54" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function AuditTable({ logs }) {
  return (
    <div>
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-300 text-slate-600">
          <tr>
            <th className="py-2 pr-4">Time (UTC)</th>
            <th className="py-2 pr-4">User</th>
            <th className="py-2 pr-4">Action</th>
            <th className="py-2 pr-4">Target</th>
            <th className="py-2 pr-4">Details</th>
            <th className="py-2 pr-4">Result</th>
          </tr>
        </thead>
        <tbody>
          {logs.slice(0, 8).map((row) => (
            <tr key={row.id} className="border-b border-slate-200">
              <td className="py-2 pr-4">{row.time}</td>
              <td className="py-2 pr-4">{row.user}</td>
              <td className="py-2 pr-4">
                <Icon name="activity" className="inline" size={14} /> {row.action}
              </td>
              <td className="py-2 pr-4">{row.target}</td>
              <td className="py-2 pr-4">{row.details}</td>
              <td className="py-2 pr-4">
                <span
                  className={`${row.result === "Warning" ? "text-amber-600" : row.result === "Failed" ? "text-red-600" : "text-green-700"} font-bold`}
                >
                  {row.result}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 text-xs text-slate-600">Showing 1 to {Math.min(logs.length, 8)} of {logs.length} entries</div>
    </div>
  );
}

function TabContent({ state, patch }) {
  if (state.activeTab === "audit") return <AuditTable logs={state.logs} />;

  if (state.activeTab === "telemetry") {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard title="Optical Power" unit="dBm" values={state.telemetry.opticalPower} color="green" />
        <MetricCard title="Switch Latency" unit="ms" values={state.telemetry.latency} color="blue" />
        <MetricCard title="Active Alarms" unit="events" values={state.telemetry.alarms} color="red" />
      </div>
    );
  }

  if (state.activeTab === "ztp") {
    return (
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="space-y-2">
          {state.ztpSteps.map((step, index) => (
            <label key={step.label} className="flex items-center gap-3 rounded-md border border-slate-300 p-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-green-600"
                checked={step.done}
                onChange={(event) =>
                  patch((current) => ({
                    ...current,
                    ztpSteps: current.ztpSteps.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, done: event.target.checked } : item,
                    ),
                  }))
                }
              />
              <span className="font-bold">{step.label}</span>
            </label>
          ))}
        </div>
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm">
          <div className="font-black text-blue-900">ZTP Status</div>
          <div className="mt-2 text-blue-800">
            {state.ztpSteps.filter((step) => step.done).length} of {state.ztpSteps.length} workflow checks complete.
          </div>
        </div>
      </div>
    );
  }

  if (state.activeTab === "certs") {
    return (
      <div className="rounded-md border border-slate-300 p-4">
        <div className="mb-3 flex items-center gap-2 text-lg font-black">
          <Icon name="lockCheck" className="text-green-600" size={20} /> Certificate / mTLS Management
        </div>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="font-bold text-slate-500">Readiness</dt>
            <dd className="mt-1">
              <span className="badge tuned">Ready</span>
            </dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">Issuer</dt>
            <dd className="mt-1 font-semibold">{state.certs.issuer}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">Expires</dt>
            <dd className="mt-1 font-semibold">{state.certs.expires}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">Fingerprint</dt>
            <dd className="mt-1 font-mono text-xs">{state.certs.fingerprint}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (state.activeTab === "upgrade") {
    return (
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-md border border-slate-300 p-4">
          <div className="mb-2 text-lg font-black">Software Upgrade Workflow</div>
          <div className="text-sm text-slate-600">
            Image: <span className="font-bold text-slate-900">{state.upgrade.image}</span>
          </div>
          <div className="mt-4 h-3 rounded bg-slate-200">
            <div className="h-full rounded bg-blue-600 transition-all" style={{ width: `${state.upgrade.progress}%` }} />
          </div>
          <div className="mt-2 text-sm font-bold">
            Stage: {state.upgrade.stage} ({state.upgrade.progress}%)
          </div>
        </div>
        <div className="grid gap-2">
          {[
            ["Install", 40],
            ["Activate", 75],
            ["Verify", 100],
          ].map(([stage, progress]) => (
            <button
              key={stage}
              className="h-10 rounded-md border border-blue-500 font-bold text-blue-700 hover:bg-blue-50"
              onClick={() => patch((current) => ({ ...current, upgrade: { ...current.upgrade, stage, progress } }))}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (state.activeTab === "ntp") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(state.ntpDns).map(([key, value]) => (
          <label key={key} className="text-sm font-bold">
            {key}
            <input className="mt-1 h-10 w-full rounded border border-slate-300 px-3" value={value} readOnly />
          </label>
        ))}
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-300 text-xs text-slate-600">
        <tr>
          <th className="py-2">Source</th>
          <th>Protocol</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {state.acl.map((rule) => (
          <tr key={rule.id} className="border-b border-slate-200">
            <td className="py-2">{rule.source}</td>
            <td>{rule.protocol}</td>
            <td>
              <span className={`${rule.action === "allow" ? "text-green-700" : "text-red-700"} font-bold`}>{rule.action}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function WorkflowPanel({ state, patch }) {
  return (
    <section className="module rounded-md">
      <div className="flex overflow-hidden border-b border-slate-300 bg-slate-50 text-sm font-bold">
        {WORKFLOW_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button min-w-[78px] border-b-2 border-transparent px-2 py-3 ${state.activeTab === tab.id ? "active" : ""}`}
            onClick={() => patch({ activeTab: tab.id })}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-[272px] p-4">
        <TabContent state={state} patch={patch} />
      </div>
    </section>
  );
}

export function OnboardingPanel({ state, patch }) {
  const completed = state.onboarding.filter((item) => item.done).length;

  return (
    <aside className="module rounded-md p-3">
      <div className="mb-2 text-base font-black">Onboarding Checklist</div>
      <div className="mb-3 text-xs font-bold">
        {completed} / {state.onboarding.length} Completed
      </div>
      <div className="mb-3 h-1.5 rounded bg-slate-200">
        <div className="h-full rounded bg-blue-600" style={{ width: `${(completed / state.onboarding.length) * 100}%` }} />
      </div>
      <div className="space-y-2 text-xs">
        {state.onboarding.map((item, index) => (
          <label key={item.label} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-green-600"
              checked={item.done}
              onChange={(event) =>
                patch((current) => ({
                  ...current,
                  onboarding: current.onboarding.map((step, stepIndex) =>
                    stepIndex === index ? { ...step, done: event.target.checked } : step,
                  ),
                }))
              }
            />
            <span className={item.done ? "text-slate-700" : "text-slate-600"}>{item.label}</span>
          </label>
        ))}
      </div>
      <button className="mt-4 h-10 w-full rounded-md border border-blue-500 text-sm font-bold text-blue-700 hover:bg-blue-50">
        <Icon name="book" className="inline" size={16} /> View Full Guide
      </button>
    </aside>
  );
}

export function TroubleshootingPanel() {
  return (
    <aside className="module rounded-md">
      <div className="border-b border-slate-300 px-4 py-3 text-base font-black">Troubleshooting</div>
      <div className="p-3">
        <div className="mb-3 text-sm font-black">Common Validation Errors</div>
        <div className="space-y-3">
          {TROUBLESHOOTING_CARDS.map((card) => {
            const color = card.severity === "error" ? "border-red-300 bg-red-50 text-red-700" : "border-amber-300 bg-amber-50 text-amber-700";
            return (
              <button key={card.title} className={`w-full rounded-md border ${color} p-3 text-left hover:brightness-[0.98]`}>
                <div className="flex gap-2">
                  <Icon name={card.severity === "error" ? "alertCircle" : "alertTriangle"} className="mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-black">{card.title}</div>
                    <div className="mt-1 text-xs text-slate-700">{card.detail}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <button className="mt-4 h-10 w-full rounded-md border border-blue-500 text-sm font-bold text-blue-700 hover:bg-blue-50">
          <Icon name="tool" className="inline" size={16} /> View All Diagnostics
        </button>
      </div>
    </aside>
  );
}
