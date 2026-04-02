export default function Card({ children, className = "", padding = true, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 ${padding ? "p-5" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
