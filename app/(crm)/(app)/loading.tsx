export default function CrmAppLoading() {
  return (
    <div aria-hidden="true">
      <div className="crm-page-head">
        <div>
          <div className="crm-skeleton" style={{ width: 160, height: 24 }} />
          <div className="crm-skeleton" style={{ width: 220, height: 14, marginTop: 8 }} />
        </div>
      </div>

      <div className="crm-kpi-grid">
        {["kpi-1", "kpi-2", "kpi-3", "kpi-4"].map((id) => (
          <div key={id} className="crm-kpi">
            <div className="crm-skeleton" style={{ width: "60%", height: 12 }} />
            <div className="crm-skeleton" style={{ width: "40%", height: 26, marginTop: 12 }} />
          </div>
        ))}
      </div>

      <div className="crm-row">
        <div className="crm-card crm-card-pad">
          <div className="crm-skeleton" style={{ width: "30%", height: 14 }} />
          <div className="crm-skeleton" style={{ width: "100%", height: 110, marginTop: 16 }} />
        </div>
        <div className="crm-card crm-card-pad">
          <div className="crm-skeleton" style={{ width: "40%", height: 14 }} />
          <div className="crm-skeleton" style={{ width: "100%", height: 110, marginTop: 16 }} />
        </div>
      </div>
    </div>
  );
}
