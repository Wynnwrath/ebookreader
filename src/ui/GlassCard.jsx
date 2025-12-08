export default function GlassCard({
  children,
  className = "",
  padding = "p-4",
  rounded = "rounded-xl",
  ...props
}) {
  return (
    <div
      className={`glass-card ${padding} ${rounded} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
