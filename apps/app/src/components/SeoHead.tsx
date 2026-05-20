import Head from "expo-router/head";

type SeoHeadProps = {
  canonicalPath?: string;
  description: string;
  imagePath?: string;
  jsonLd?: Record<string, unknown>[];
  lang?: string;
  noindex?: boolean;
  title: string;
};

const SITE_URL = "https://athmira.com";
const DEFAULT_IMAGE_PATH = "/og-image.png";

export function SeoHead({
  canonicalPath = "/",
  description,
  imagePath = DEFAULT_IMAGE_PATH,
  jsonLd = [],
  lang = "es",
  noindex = false,
  title
}: SeoHeadProps) {
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const imageUrl = imagePath.startsWith("http") ? imagePath : `${SITE_URL}${imagePath}`;
  const robots = noindex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large";

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#063f3d" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Athmira" />
      <meta property="og:locale" content={lang === "es" ? "es_CO" : "en_US"} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content="Athmira, app de Bike Fit, postura, presión de llantas y nutrición para ciclistas" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {jsonLd.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Head>
  );
}
