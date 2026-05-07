import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "./Provider";

export const metadata: Metadata = {
  title: "Facility Client Tool",
  description: "Data collection and sync tool for facilities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
