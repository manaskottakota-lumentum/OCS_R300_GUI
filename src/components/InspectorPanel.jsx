import { STATUS_LABELS, hvdac, statusForPort, validateSnapshot } from "../ocsModel.js";
import { Icon } from "./Icon.jsx";

function SelectedBadge({ status }) {
  return <span className={`badge ${status}`}>{STATUS_LABELS[status] || status}</span>;
}

function PortDetail({ title, port, status, label, onLabelChange }) {
  return (
    <div className="field-box">
      <div className="mb-3 text-sm font-black">{title}</div>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt>Port ID:</dt>
          <dd className="font-semibold">{port}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Status:</dt>
          <dd>
            <SelectedBadge status={status} />
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>HVDAC:</dt>
          <dd className="font-bold text-blue-700">{hvdac(port)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt>Label:</dt>
          <dd>
            <input className="h-8 w-24 rounded border border-slate-300 px-2 text-sm" value={label} onChange={onLabelChange} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function InspectorPanel({
  state,
  snapshot,
  onUpdateSelectedLabel,
  onSaveProfile,
  onLoadProfile,
  onRollback,
  onPreviewRollback,
  onShowValidation,
}) {
  const connection =
    snapshot.connections.find((item) => item.a === state.selected.a || item.b === state.selected.b) || snapshot.connections[0];
  const findings = validateSnapshot(state.draft);
  const errors = findings.filter((finding) => finding.severity === "error");
  const aStatus = statusForPort(snapshot, connection.a);
  const bStatus = statusForPort(snapshot, connection.b);
  const overallStatus = aStatus === "blocked" || bStatus === "blocked" ? "blocked" : connection.status;

  return (
    <aside className="module rounded-md">
      <div className="flex items-center border-b border-slate-300 px-4 py-3">
        <h2 className="mr-auto text-base font-black">Selected Connection</h2>
        <button title="Collapse inspector">
          <Icon name="chevronUp" size={20} />
        </button>
      </div>

      <div className="p-3">
        <div className="mb-3 flex items-center gap-3">
          <div className="mr-auto text-2xl font-black">
            {connection.a} -&gt; {connection.b}
          </div>
          <SelectedBadge status={overallStatus} />
        </div>

        <div className="inspector-grid mb-3">
          <PortDetail
            title="A-Side (Ingress)"
            port={connection.a}
            status={aStatus}
            label={connection.label || ""}
            onLabelChange={(event) => onUpdateSelectedLabel(event.target.value)}
          />
          <PortDetail
            title="B-Side (Egress)"
            port={connection.b}
            status={bStatus}
            label={(connection.label || "").replace("A", "B")}
            onLabelChange={(event) => onUpdateSelectedLabel(event.target.value)}
          />
        </div>

        <div className="mb-3 rounded-md border border-slate-300 bg-white p-3">
          <div className="mb-2 flex items-center gap-3">
            <div className="mr-auto text-sm font-black">Validation Result</div>
            <button className="rounded border border-slate-300 px-3 py-1.5 text-xs font-bold hover:bg-slate-50" onClick={onShowValidation}>
              View Details
            </button>
          </div>
          {errors.length ? (
            <div className="flex items-start gap-2 text-red-700">
              <Icon name="alertCircle" size={18} />
              <div>
                <div className="font-bold">
                  {errors.length} error{errors.length === 1 ? "" : "s"} found
                </div>
                <div className="text-xs text-slate-600">Resolve blocking validation errors before apply.</div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-green-700">
              <Icon name="circleCheck" size={18} />
              <div>
                <div className="font-bold">Valid</div>
                <div className="text-xs text-slate-600">No errors found</div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-3 border-y border-slate-300 py-3">
          <div className="mb-3 text-sm font-black">Profile & Rollback</div>
          <div className="mb-3 grid grid-cols-[88px_1fr_36px] items-center gap-2 text-sm">
            <label htmlFor="profileSelect">Profile:</label>
            <select id="profileSelect" className="h-9 rounded border border-slate-300 bg-white px-3">
              {state.profiles.map((profile, index) => (
                <option key={profile.name} value={index}>
                  {profile.name}
                </option>
              ))}
            </select>
            <button className="h-9 rounded border border-blue-400 text-blue-700 hover:bg-blue-50" title="Save profile" onClick={onSaveProfile}>
              <Icon name="save" size={20} />
            </button>
            <label htmlFor="rollbackSelect">Rollback Target:</label>
            <select id="rollbackSelect" className="h-9 rounded border border-slate-300 bg-white px-3">
              <option>Last Known Good</option>
              <option>Factory Baseline</option>
              <option>Previous Draft</option>
            </select>
            <button className="h-9 rounded border border-blue-400 text-blue-700 hover:bg-blue-50" title="Load selected profile" onClick={onLoadProfile}>
              <Icon name="folderUp" size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="h-10 rounded-md border border-blue-500 bg-white text-sm font-bold text-blue-700 hover:bg-blue-50"
              onClick={onPreviewRollback}
            >
              <Icon name="rollbackPreview" size={16} /> Preview Rollback
            </button>
            <button className="h-10 rounded-md bg-red-500 text-sm font-black text-white hover:bg-red-600" onClick={onRollback}>
              <Icon name="history" size={16} /> Rollback
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-700">
          <div className="mb-1 font-black">Connection ID (UUID):</div>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-slate-50 px-1.5 py-1">{connection.id}</code>
            <button className="h-8 w-8 rounded border border-slate-300 hover:bg-slate-50" title="Copy UUID">
              <Icon name="copy" size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
