export default function ChatLayout({
  children,
}: LayoutProps<"/chat">) {
  return (
    <div className="h-dvh max-h-dvh overflow-hidden">{children}</div>
  );
}
