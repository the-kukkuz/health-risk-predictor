import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStatistics, NotReadyError } from "../services/api";
import LoadingCard from "../components/LoadingCard";
import NotReady from "../components/NotReady";
import ErrorAlert from "../components/ErrorAlert";
import RiskDistributionChart from "../charts/RiskDistributionChart";
import AgeDistributionChart from "../charts/AgeDistributionChart";
import FeatureImportanceChart from "../charts/FeatureImportanceChart";
import BmiOutcomeChart from "../charts/BmiOutcomeChart";
import PerformanceTable from "../components/PerformanceTable";

// Analytics is also disease-driven. Diabetes renders charts from /statistics;
// heart returns not_ready and the same NotReady component is shown. When the
// heart module ships its statistics, only the backend response + this switch
// need data -- the chart components are reusable.
export default function AnalyticsPage() {
  const { disease = "diabetes" } = useParams();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not_ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    getStatistics(disease)
      .then((d) => {
        if (!active) return;
        setData(d);
        setStatus(d.status === "not_ready" ? "not_ready" : "ready");
        if (d.status === "not_ready") setMessage(d.message);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof NotReadyError) {
          setStatus("not_ready");
          setMessage(err.detail.message);
        } else {
          setStatus("error");
          setMessage(err.message);
        }
      });
    return () => {
      active = false;
    };
  }, [disease]);

  if (status === "loading") return <LoadingCard label="Loading analytics..." />;
  if (status === "not_ready")
    return <NotReady message={message} disease={disease} />;
  if (status === "error") return <ErrorAlert message={message} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 capitalize">
          {disease.replace("_", " ")} Population Analytics
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Based on the UCI Pima Indians dataset ({data.n_records} records).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Predicted risk distribution
          </h3>
          <RiskDistributionChart data={data.risk_distribution} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Age distribution
          </h3>
          <AgeDistributionChart data={data.age_distribution} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Feature importance
          </h3>
          <FeatureImportanceChart data={data.feature_importance} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Diabetes rate by BMI group
          </h3>
          <BmiOutcomeChart data={data.bmi_vs_outcome} />
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Model performance (held-out test set)
        </h3>
        <PerformanceTable perf={data.model_performance} />
      </div>

      {data.disclaimer && (
        <p className="text-xs text-slate-500 leading-relaxed">{data.disclaimer}</p>
      )}
    </div>
  );
}
