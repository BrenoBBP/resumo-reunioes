import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ui";

export const metadata: Metadata = {
  title: "Resumo de Reuniões - IA",
  description: "Capture, transcreva e resuma suas reuniões com inteligência artificial",
  keywords: ["reuniões", "transcrição", "IA", "resumo", "produtividade"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
