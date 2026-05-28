import Image, { type ImageProps } from "next/image";

type ImageContext =
  | "hero"
  | "product-gallery"
  | "product-thumb"
  | "content-banner"
  | "avatar"
  | "icon";

type AppImageProps = Omit<ImageProps, "alt" | "quality" | "loading"> & {
  alt?: string;
  context: ImageContext;
  decorative?: boolean;
};

const presets: Record<
  ImageContext,
  { quality: number; sizes: string; priority: boolean; loading: "eager" | "lazy" }
> = {
  hero: {
    quality: 72,
    sizes: "100vw",
    priority: true,
    loading: "eager",
  },
  "product-gallery": {
    quality: 68,
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw",
    priority: false,
    loading: "lazy",
  },
  "product-thumb": {
    quality: 65,
    sizes: "(max-width: 768px) 45vw, 240px",
    priority: false,
    loading: "lazy",
  },
  "content-banner": {
    quality: 68,
    sizes: "(max-width: 768px) 100vw, 80vw",
    priority: false,
    loading: "lazy",
  },
  avatar: {
    quality: 65,
    sizes: "96px",
    priority: false,
    loading: "lazy",
  },
  icon: {
    quality: 70,
    sizes: "64px",
    priority: false,
    loading: "lazy",
  },
};

export function AppImage({ context, decorative = false, alt, ...props }: AppImageProps) {
  const preset = presets[context];
  const resolvedAlt = decorative ? "" : (alt ?? "");
  const resolvedSizes = props.sizes ?? preset.sizes;
  const resolvedPriority = props.priority ?? preset.priority;
  const resolvedLoading = resolvedPriority ? undefined : preset.loading;

  return (
    <Image
      {...props}
      alt={resolvedAlt}
      aria-hidden={decorative ? true : undefined}
      quality={preset.quality}
      sizes={resolvedSizes}
      priority={resolvedPriority}
      loading={resolvedLoading}
    />
  );
}
