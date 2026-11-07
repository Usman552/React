export default function Skeleton({ lines = 3, height = 14 }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton__line" style={{ height, width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}
