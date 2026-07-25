"use client";

import { useState } from "react";
import { IconSettings } from "@/components/ui/icons";
import { useOperationsLayout } from "@/contexts/operations/OperationsLayoutContext";
import { OPERATIONS_WIDGET_LABEL } from "@/domain/operations/widgets";

export function OperationsWidgetSettings() {
  const [open, setOpen] = useState(false);
  const { layout, toggleVisible, moveUp, moveDown } = useOperationsLayout();

  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="btn btn-outline" onClick={() => setOpen((v) => !v)}>
        <IconSettings size={14} /> Personalizar tela
      </button>

      {open && (
        <div
          className="crm-modal"
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            width: 320,
            zIndex: 20,
            padding: 16,
          }}
        >
          <div className="crm-modal-title" style={{ marginBottom: 8 }}>
            Widgets desta tela
          </div>
          {layout.map((widget) => (
            <div key={widget.key} className="crm-ops-widget-settings-row">
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={widget.visible}
                  onChange={() => toggleVisible(widget.key)}
                />
                {OPERATIONS_WIDGET_LABEL[widget.key]}
              </label>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  type="button"
                  className="crm-icon-btn"
                  onClick={() => moveUp(widget.key)}
                  aria-label="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="crm-icon-btn"
                  onClick={() => moveDown(widget.key)}
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
