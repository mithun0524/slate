import DocsNav from "@/components/DocsNav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap docs">
      <DocsNav />
      {children}
    </div>
  );
}
