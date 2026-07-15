// Lightweight inline file-type icons (no external icon font — CSP-safe).
// Approximates the Cursor/VS Code explorer: colored language glyphs + folders.

const COLOR: Record<string, string> = {
  js: "#e8d44d",
  jsx: "#e8d44d",
  mjs: "#e8d44d",
  cjs: "#e8d44d",
  ts: "#4fa6e0",
  tsx: "#4fa6e0",
  json: "#e8d44d",
  md: "#519aba",
  markdown: "#519aba",
  html: "#e37933",
  css: "#519aba",
  scss: "#cf649a",
  py: "#4b8bbe",
  rs: "#dea584",
  go: "#4fc4d6",
  yml: "#cb4b4b",
  yaml: "#cb4b4b",
  toml: "#9c8a6b",
  sh: "#89e051",
  bash: "#89e051",
  zsh: "#89e051",
  env: "#d0a84a",
  lock: "#8a8a8a",
  txt: "#9d9d9d",
  svg: "#ffb13b",
  png: "#a074c4",
  jpg: "#a074c4",
  jpeg: "#a074c4",
  gif: "#a074c4",
};

const FOLDER = "#d9b45b";

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="fi">
      <rect x="1" y="1.5" width="14" height="13" rx="3" fill={color} />
      <text
        x="8"
        y="10.4"
        textAnchor="middle"
        fontSize={text.length > 2 ? 4.6 : 6}
        fontWeight="700"
        fill="#1b1b1b"
        fontFamily="ui-sans-serif, system-ui"
      >
        {text}
      </text>
    </svg>
  );
}

function Doc({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="fi" fill="none" strokeLinejoin="round">
      <path
        d="M3.5 1.5h5.5l3.5 3.5v9.5h-9z"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.1"
      />
      <path d="M9 1.5V5h3.5" stroke={color} strokeWidth="1.1" />
    </svg>
  );
}

function MdIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="fi" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="2" stroke={color} strokeWidth="1.1" />
      <path
        d="M3.5 10.5V6l2 2 2-2v4.5M11 6v4m0 0l-1.4-1.4M11 10l1.4-1.4"
        stroke={color}
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HtmlIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="fi" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5L3 8l3 3M10 5l3 3-3 3" />
    </svg>
  );
}

function Folder({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="fi" fill="none">
      <path
        d={
          open
            ? "M2 4.5A1.5 1.5 0 013.5 3h3l1.5 1.5h5A1.5 1.5 0 0114.5 6H4l-2 6.5z"
            : "M2 4.5A1.5 1.5 0 013.5 3h3l1.5 1.5h4.5A1.5 1.5 0 0114 6.5v5A1.5 1.5 0 0112.5 13h-9A1.5 1.5 0 012 11.5z"
        }
        fill={FOLDER}
        fillOpacity="0.25"
        stroke={FOLDER}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FileIcon({
  name,
  dir = false,
  open = false,
}: {
  name: string;
  dir?: boolean;
  open?: boolean;
}) {
  if (dir) return <Folder open={open} />;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const color = COLOR[ext] ?? "#9d9d9d";

  if (ext === "js" || ext === "mjs" || ext === "cjs") return <Badge text="JS" color={color} />;
  if (ext === "jsx") return <Badge text="JSX" color={color} />;
  if (ext === "ts") return <Badge text="TS" color={color} />;
  if (ext === "tsx") return <Badge text="TSX" color={color} />;
  if (ext === "json") return <Badge text="{}" color={color} />;
  if (ext === "md" || ext === "markdown") return <MdIcon color={color} />;
  if (ext === "html") return <HtmlIcon color={color} />;
  return <Doc color={color} />;
}
