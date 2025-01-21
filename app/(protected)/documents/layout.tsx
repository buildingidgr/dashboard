import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents",
  description: "Create and manage documents.",
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 