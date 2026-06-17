const NAV_ITEMS = [
  ["ti-home", "Dashboard"],
  ["ti-topology-star-3", "Matrix"],
  ["ti-server-2", "Ports"],
  ["ti-shield-cog", "Provisioning"],
  ["ti-chart-bar", "Telemetry"],
  ["ti-user-cog", "Admin"],
  ["ti-file-text", "Docs"],
];

export function Sidebar() {
  return (
    <aside className="sidebar flex flex-col p-3">
      <nav className="space-y-1">
        {NAV_ITEMS.map(([icon, label]) => (
          <div key={label} className={`nav-item ${label === "Matrix" ? "active" : ""}`}>
            <i className={`ti ${icon} text-2xl`} />
            <span className="nav-label">{label}</span>
          </div>
        ))}
      </nav>

      <div className="device-card mt-auto rounded-md border border-slate-300 bg-white p-4 text-xs">
        <div className="text-sm font-black">OCS R300-1</div>
        <div className="mt-2 flex items-center gap-2 font-bold text-green-700">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
          System Healthy
        </div>
        <dl className="mt-5 space-y-2 text-slate-700">
          <div className="flex justify-between gap-2">
            <dt>Serial:</dt>
            <dd>OCSR30012345</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Version:</dt>
            <dd>2.0.2-007</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Uptime:</dt>
            <dd>12d 04:38:21</dd>
          </div>
        </dl>
        <div className="mt-4 border-t border-slate-200 pt-3">
          <button className="mb-2 flex w-full items-center gap-2 rounded px-1 py-1 font-bold text-blue-700 hover:bg-blue-50">
            <i className="ti ti-download" />
            Support Bundle
          </button>
          <button className="flex w-full items-center gap-2 rounded px-1 py-1 font-bold text-blue-700 hover:bg-blue-50">
            <i className="ti ti-refresh" />
            System Reboot
          </button>
        </div>
      </div>
    </aside>
  );
}
