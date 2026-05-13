import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
/* Quill snow theme for admin RichTextEditor (global import required by Next.js) */
import "react-quill/dist/quill.snow.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "EduGlobe Academy – Learn More; Grow More",
  description:
    "EduGlobe Academy provides high-quality learning resources and structured guidance for TET, DSC, and competitive exams, with focus on Mathematics and English.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = headers().get("x-pathname") ?? "";
  const embedShell = pathname.startsWith("/embed/");

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
        <Providers>
          {embedShell ? (
            <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
              {children}
            </div>
          ) : (
            <>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}
