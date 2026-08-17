interface Props {
  message: string;
  disease: string;
}

// Graceful "module being integrated" state for the heart placeholder. Shows
// no fake probabilities or charts. The same component will simply not render
// once the real heart module returns a 200 response.
export default function NotReady({ message, disease }: Props) {
  return (
    <div className="card border-dashed border-2 border-slate-300 text-center py-10">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-700">
        Module not yet available
      </h3>
      <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{message}</p>
      <p className="mt-3 text-xs text-slate-400">
        The <code className="bg-slate-100 px-1 rounded">{disease}</code> module
        is being integrated behind the same API. No predictions are fabricated.
      </p>
    </div>
  );
}
