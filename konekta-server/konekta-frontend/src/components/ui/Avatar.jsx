import { getInitials } from "../../utils/formatters";

export default function Avatar({ src, name, size = "md", className = "" }) {
  const sizes = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-20 h-20 text-xl",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-gray-800 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold ring-2 ring-white dark:ring-gray-800 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
