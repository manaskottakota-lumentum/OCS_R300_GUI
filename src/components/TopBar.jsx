export function TopBar({ state, onChange }) {
  return (
    <header className="topbar flex items-center gap-3 px-4">
      <button className="h-10 w-10 rounded-md hover:bg-slate-100" title="Toggle navigation">
        <i className="ti ti-menu-2 text-2xl" />
      </button>

      <div className="min-w-[190px]">
        <div className="text-2xl font-black leading-6 tracking-normal">OCS R300</div>
        <div className="brand-subtitle text-sm text-slate-600">Optical Circuit Switch</div>
      </div>

      <div className="hidden min-w-0 flex-1 items-center rounded-md border border-slate-300 bg-white shadow-sm md:flex">
        <div className="flex h-12 min-w-[210px] items-center gap-2 border-r border-slate-200 px-4 text-sm">
          <span className="font-bold">Target:</span>
          <select
            className="min-w-0 flex-1 bg-transparent font-semibold outline-none"
            value={state.target}
            onChange={(event) => onChange({ target: event.target.value })}
          >
            <option>10.13.186.94</option>
            <option>10.13.186.95</option>
            <option>10.13.187.12</option>
          </select>
        </div>
        <div className="flex h-12 items-center gap-2 border-r border-slate-200 px-4 text-sm">
          <span className="font-bold">gRPC Port:</span>
          <span className="font-semibold">{state.grpcPort}</span>
        </div>
        <button
          className="flex h-12 items-center gap-2 border-r border-slate-200 px-4 text-sm font-semibold"
          onClick={() => onChange({ connected: !state.connected })}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${state.connected ? "bg-green-600" : "bg-red-500"}`} />
          <span>{state.connected ? "Connected" : "Disconnected"}</span>
        </button>
        <div className="flex h-12 items-center gap-2 border-r border-slate-200 px-4 text-sm font-semibold">
          <i className="ti ti-lock-filled text-lg text-green-600" />
          <span>{state.mtls ? "mTLS Enabled" : "mTLS Disabled"}</span>
        </div>
        <div className="flex h-12 items-center gap-2 px-4 text-sm">
          <span className="font-bold">Role:</span>
          <select
            className="bg-transparent font-semibold outline-none"
            value={state.role}
            onChange={(event) => onChange({ role: event.target.value })}
          >
            <option>Admin</option>
            <option>Operator</option>
            <option>Read Only</option>
          </select>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="hidden h-10 items-center gap-2 border-r border-slate-200 px-4 text-sm font-bold lg:flex">
          <i className="ti ti-shield-check text-lg" />
          Audit: <span>{state.auditEnabled ? "Enabled" : "Disabled"}</span>
        </div>
        <button className="relative h-10 w-10 rounded-md hover:bg-slate-100" title="Notifications">
          <i className="ti ti-bell text-2xl" />
          <span className="absolute right-1.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            3
          </span>
        </button>
        <button className="h-10 w-10 rounded-md hover:bg-slate-100" title="User profile">
          <i className="ti ti-user-circle text-2xl" />
        </button>
      </div>
    </header>
  );
}
