import { FileText } from "lucide-react";

// Preview of a proof file from its blob URL: images as <img>, PDFs in the browser's own viewer, other types a file icon.
export default function FileThumb({ url, file, className }: { url: string; file: File; className: string }) {
  if (file.type.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element -- blob URL, next/image cannot load it
    return <img src={url} alt="" className={`${className} object-contain`} />;
  }
  if (file.type === "application/pdf") {
    return (
      <iframe
        src={`${url}#toolbar=0&navpanes=0&view=FitH`}
        title={`Peržiūra: ${file.name}`}
        tabIndex={-1}
        loading="lazy"
        // pointer-events-none: clicks reach the surrounding link instead of the PDF viewer
        className={`${className} pointer-events-none`}
      />
    );
  }
  return (
    <span className={`${className} grid place-items-center text-muted-foreground`}>
      <FileText className="size-8" aria-hidden />
    </span>
  );
}
