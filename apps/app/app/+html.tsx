import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="application-name" content="athmira" />
        <meta name="apple-mobile-web-app-title" content="athmira" />
        <meta name="theme-color" content="#063f3d" />
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="athmira LLMs.txt" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
