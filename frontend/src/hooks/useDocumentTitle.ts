import { useEffect } from "react";

const SUFFIX = "HoofPrint Forensics";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} \u00b7 ${SUFFIX}` : `${SUFFIX} \u00b7 Abiola Ajimobi Technical University`;
  }, [title]);
}
