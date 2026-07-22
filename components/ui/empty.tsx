import { cn } from "@/lib/utils";

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center py-16 px-6",
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

function EmptyMedia({
  variant = "icon",
  className,
  ...props
}: React.ComponentProps<"div"> & { variant?: "icon" | "plain" }) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      className={cn(
        "flex items-center justify-center",
        variant === "icon" && "w-14 h-14 rounded-2xl mb-1",
        className,
      )}
      style={
        variant === "icon"
          ? {
              background: "linear-gradient(135deg, rgba(37,208,195,0.14), rgba(31,94,255,0.1))",
              color: "var(--secondary)",
            }
          : undefined
      }
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="empty-title"
      className={cn("text-[15px] font-extrabold tracking-tight", className)}
      style={{ color: "var(--primary)" }}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn("text-[13px] max-w-sm", className)}
      style={{ color: "var(--muted)" }}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn("flex items-center gap-2 mt-2", className)}
      {...props}
    />
  );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
