import { useEffect } from "react";
import type { ApprovalReq } from "../lib/ipc";

// Agent approval request — the agent is blocked until the human decides.
export function ApprovalPrompt({
  req,
  onDecide,
}: {
  req: ApprovalReq;
  onDecide: (approved: boolean) => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onDecide(true);
      else if (e.key === "Escape") onDecide(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onDecide]);

  return (
    <div className="approval">
      <div className="approval-glow" />
      <div className="approval-body">
        <div className="approval-tag">Agent · needs approval</div>
        <div className="approval-title">{req.title}</div>
        {req.detail && <div className="approval-detail">{req.detail}</div>}
      </div>
      <div className="approval-actions">
        <button className="approval-reject" onClick={() => onDecide(false)}>
          Reject
          <span className="approval-kbd">esc</span>
        </button>
        <button className="approval-approve" onClick={() => onDecide(true)}>
          Approve
          <span className="approval-kbd">⌘↵</span>
        </button>
      </div>
    </div>
  );
}
