import {
  PORT_COUNT,
  ROW_HEIGHT,
  STATUS_COLORS,
  portNumber,
  statusForPort,
  visibleNumbers,
} from "../ocsModel.js";
import { Icon } from "./Icon.jsx";

function PortRow({ port, status, selected, showLabels, onSelect }) {
  return (
    <button
      className={`port-row w-full text-left ${selected ? "selected" : ""}`}
      title={`${port} - ${status}`}
      onClick={() => onSelect(port)}
    >
      <span className={`status-dot ${status}`} />
      <span>{showLabels ? port : portNumber(port)}</span>
    </button>
  );
}

function EllipsisRow() {
  return <div className="port-row ellipsis">...</div>;
}

function MatrixConnections({ snapshot, rows, selected, zoom }) {
  const rowIndex = new Map();
  rows.forEach((row, index) => {
    if (row !== "ellipsis") rowIndex.set(row, index);
  });

  const width = 720;
  const height = rows.length * ROW_HEIGHT;
  const curve = Math.max(90, width * 0.32) * (zoom / 100);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {snapshot.connections
        .filter((connection) => rowIndex.has(portNumber(connection.a)) && rowIndex.has(portNumber(connection.b)))
        .map((connection) => {
          const y1 = rowIndex.get(portNumber(connection.a)) * ROW_HEIGHT + ROW_HEIGHT / 2;
          const y2 = rowIndex.get(portNumber(connection.b)) * ROW_HEIGHT + ROW_HEIGHT / 2;
          const isSelected = connection.a === selected.a || connection.b === selected.b;
          const stroke = isSelected ? "#0d6efd" : STATUS_COLORS[connection.status] || STATUS_COLORS.available;
          const strokeWidth = isSelected ? 3 : connection.status === "available" ? 1.4 : 2;
          const opacity = isSelected ? 1 : connection.status === "available" ? 0.45 : 0.82;

          return (
            <path
              key={connection.id}
              className={`link-line ${isSelected ? "selected" : ""}`}
              d={`M 0 ${y1} C ${curve} ${y1}, ${width - curve} ${y2}, ${width} ${y2}`}
              stroke={stroke}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          );
        })}
    </svg>
  );
}

function Minimap({ snapshot, centerPort, onJump }) {
  const active = new Map(snapshot.connections.map((connection) => [portNumber(connection.a), connection.status]));
  const cells = [];

  for (let i = 1; i <= PORT_COUNT; i += 1) {
    const status = active.get(i) || "available";
    const inWindow = Math.abs(i - centerPort) <= 5;
    cells.push(
      <button
        key={i}
        className={`mini-cell ${status} ${inWindow ? "window" : ""}`}
        title={`Port ${i}`}
        onClick={() => onJump(i)}
      />,
    );
  }

  return <div className="minimap">{cells}</div>;
}

export function MatrixPanel({ state, snapshot, onSelect, onCenter, onToggleLabels, onToggleMinimap, onZoom }) {
  const numbers = visibleNumbers(state.centerPort);
  const start = numbers[0];
  const end = numbers[numbers.length - 1];
  const rows = numbers.concat(end < PORT_COUNT ? ["ellipsis", PORT_COUNT] : []);
  const height = rows.length * ROW_HEIGHT;

  const selectPort = (port) => {
    const connection = snapshot.connections.find((item) => item.a === port || item.b === port);
    if (connection) {
      onSelect({ a: connection.a, b: connection.b });
      onCenter(portNumber(connection.a));
      return;
    }

    const number = portNumber(port);
    onSelect({ a: port.startsWith("A-") ? port : `A-${number}`, b: port.startsWith("B-") ? port : `B-${number}` });
    onCenter(number);
  };

  const renderPortRow = (side, row) => {
    if (row === "ellipsis") return <EllipsisRow key={`${side}-ellipsis`} />;

    const port = `${side}-${row}`;
    return (
      <PortRow
        key={port}
        port={port}
        status={statusForPort(snapshot, port)}
        selected={port === state.selected.a || port === state.selected.b}
        showLabels={state.showLabels}
        onSelect={selectPort}
      />
    );
  };

  return (
    <section className="module rounded-md">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="mr-auto flex items-center gap-2 text-base font-black">
          OCS Cross-Connect Matrix
          <button className="text-slate-500" title="Matrix information">
            <Icon name="info" size={16} />
          </button>
        </div>
        <select className="h-9 rounded border border-slate-300 bg-white px-3 text-sm" defaultValue="Auto Layout">
          <option>Auto Layout</option>
          <option>Port Order</option>
          <option>Fault First</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={state.showLabels} onChange={onToggleLabels} />
          Show Labels
        </label>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-bold">Zoom</span>
          <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
            <button className="h-9 w-10 hover:bg-slate-50" onClick={() => onZoom(Math.max(70, state.zoom - 10))}>
              <Icon name="minus" size={18} />
            </button>
            <div className="flex h-9 w-16 items-center justify-center border-x border-slate-300 text-sm">{state.zoom}%</div>
            <button className="h-9 w-10 hover:bg-slate-50" onClick={() => onZoom(Math.min(150, state.zoom + 10))}>
              <Icon name="plus" size={18} />
            </button>
          </div>
          <button className="h-9 w-9 rounded-md border border-slate-300 hover:bg-slate-50" onClick={() => onZoom(100)}>
            <Icon name="arrowsMaximize" size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[132px_minmax(220px,1fr)_132px] border-y border-slate-300 bg-slate-50 text-xs font-bold">
        <div className="px-4 py-2">A-SIDE (Ingress)</div>
        <div className="flex items-center justify-between px-5 py-2 text-slate-600">
          <span>A-1</span>
          <span>...</span>
          <span>A-300</span>
        </div>
        <div className="px-4 py-2">B-SIDE (Egress)</div>
      </div>

      <div className="matrix-layout">
        <div className="port-list">{rows.map((row) => renderPortRow("A", row))}</div>
        <div className="connection-stage" style={{ height }}>
          <MatrixConnections snapshot={snapshot} rows={rows} selected={state.selected} zoom={state.zoom} />
        </div>
        <div className="port-list">{rows.map((row) => renderPortRow("B", row))}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
        <span className="mr-auto text-slate-600">
          Showing {start} - {end} of {PORT_COUNT}
        </span>
        <div className="inline-flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2">
          <span>Legend:</span>
          <span className="flex items-center gap-1">
            <span className="status-dot tuned" />
            Tuned
          </span>
          <span className="flex items-center gap-1">
            <span className="status-dot blocked" />
            Blocked
          </span>
          <span className="flex items-center gap-1">
            <span className="status-dot failed" />
            Failed
          </span>
          <span className="flex items-center gap-1">
            <span className="status-dot available" />
            Available
          </span>
        </div>
        <label className="ml-auto flex items-center gap-2 font-bold">
          Minimap
          <input type="checkbox" className="peer hidden" checked={state.minimap} onChange={onToggleMinimap} />
          <span className="relative inline-flex h-5 w-10 items-center rounded-full bg-slate-300 after:ml-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-blue-600 peer-checked:after:translate-x-5" />
        </label>
        {state.minimap && (
          <div className="w-[220px] rounded-md border border-slate-300 bg-white p-2">
            <Minimap snapshot={snapshot} centerPort={state.centerPort} onJump={onCenter} />
          </div>
        )}
      </div>
    </section>
  );
}
