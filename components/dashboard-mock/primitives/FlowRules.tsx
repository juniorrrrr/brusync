import type { ReactNode } from "react";

export interface FlowRule {
  icon: ReactNode;
  title: string;
  sub: string;
  on?: boolean;
}

export function FlowRules({ rules }: { rules: FlowRule[] }) {
  return (
    <div className="flow-list">
      {rules.map((rule) => (
        <div className="flow-rule" key={rule.title}>
          <div className="fr-ico">{rule.icon}</div>
          <div className="fr-body">
            <div className="fr-title">{rule.title}</div>
            <div className="fr-sub">{rule.sub}</div>
          </div>
          <div className={rule.on === false ? "flow-toggle off" : "flow-toggle"} />
        </div>
      ))}
    </div>
  );
}
