import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
 


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body><Providers>{children}</Providers></body>
      </html>
    </ClerkProvider>
  );
}
