export default function PerformanceTable({
  perf,
}: {
  perf: {
    selected_family?: string;
    threshold?: number;
    test_metrics?: Record<string, number>;
  };
}) {
  const m: any = perf.test_metrics ?? {};
  const cm = (m.confusion_matrix ?? {}) as Record<string, number>;
  const rows: [string, string][] = [
    ["Selected model", perf.selected_family ?? "—"],
    ["Decision threshold", String(perf.threshold ?? "—")],
    ["Accuracy", pct(m.accuracy)],
    ["Precision", pct(m.precision)],
    ["Recall", pct(m.recall)],
    ["F1 score", pct(m.f1)],
    ["ROC-AUC", num(m.roc_auc)],
    ["True positive", String(cm.true_positive ?? "—")],
    ["False negative", String(cm.false_negative ?? "—")],
    ["True negative", String(cm.true_negative ?? "—")],
    ["False positive", String(cm.false_positive ?? "—")],
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-slate-100">
              <td className="py-2 pr-4 text-slate-500">{k}</td>
              <td className="py-2 font-medium text-slate-800">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function pct(v: number | undefined): string {
  return v === undefined ? "—" : `${(v * 100).toFixed(1)}%`;
}
function num(v: number | undefined): string {
  return v === undefined ? "—" : v.toFixed(3);
}
