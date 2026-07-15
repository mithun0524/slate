// Top chrome: brand + workspace name + cwd breadcrumb. (Window controls are
// native macOS traffic lights on the left, so we pad for them.)
export function TitleBar({ cwd }: { cwd: string }) {
  const parts = cwd.split("/").filter(Boolean);
  const name = parts[parts.length - 1] || "/";
  const crumb = parts.slice(-3);

  return (
    <div className="title-bar" data-tauri-drag-region>
      <span className="tb-traffic" />
      <span className="tb-brand">Vellum</span>
      <span className="tb-sep">—</span>
      <span className="tb-ws">{name}</span>
      <span className="tb-crumb">
        {crumb.map((p, i) => (
          <span key={i}>
            {i > 0 && <span className="tb-slash">/</span>}
            {p}
          </span>
        ))}
      </span>
    </div>
  );
}
