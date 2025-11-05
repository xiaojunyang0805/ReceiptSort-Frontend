// This is the root layout - it only holds metadata
// The actual HTML structure is in [locale]/layout.tsx
export { metadata } from './metadata';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
