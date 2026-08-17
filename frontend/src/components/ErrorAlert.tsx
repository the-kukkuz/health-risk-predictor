interface Props {
  message: string;
}

export default function ErrorAlert({ message }: Props) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {message}
    </div>
  );
}
