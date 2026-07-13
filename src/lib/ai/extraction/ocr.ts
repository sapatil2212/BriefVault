import { aiConfig } from "@/lib/ai/config";
import {
  UnsupportedFormatError,
  type ExtractionInput,
  type ExtractionResult,
  type TextExtractor,
} from "./types";

const IMAGE_MIME = /^image\/(png|jpe?g|webp|bmp|tiff?|gif)$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|bmp|tiff?|gif)$/i;

/** Below this many recognized characters, OCR is considered to have failed. */
const MIN_OCR_TEXT = 8;

/**
 * OCR extractor for image documents using tesseract.js (WASM, runs in Node).
 * Recognized text flows into the same pipeline as native text, and the OCR
 * confidence is reported on the result.
 *
 * Language data is fetched/cached by tesseract.js on first run, so the first
 * image may take longer. Controlled via OCR_ENABLED / OCR_LANGUAGES.
 */
export class ImageOcrExtractor implements TextExtractor {
  readonly kind = "IMAGE" as const;

  supports(input: ExtractionInput): boolean {
    if (input.text != null) return false;
    const mime = (input.mimeType ?? "").toLowerCase();
    const name = (input.fileName ?? "").toLowerCase();
    return IMAGE_MIME.test(mime) || IMAGE_EXT.test(name);
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    if (!aiConfig.ocr.enabled) {
      throw new UnsupportedFormatError(
        "OCR is disabled. Set OCR_ENABLED=true to extract text from images."
      );
    }

    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker(aiConfig.ocr.languages);

    try {
      const { data } = await worker.recognize(input.buffer);
      const text = (data.text ?? "").replace(/\s+\n/g, "\n").trim();
      const confidence = Math.max(0, Math.min(1, (data.confidence ?? 0) / 100));

      if (text.length < MIN_OCR_TEXT) {
        throw new UnsupportedFormatError(
          "OCR could not find readable text in this image. The file has been stored."
        );
      }

      return {
        kind: this.kind,
        text,
        pages: [{ page: 1, text }],
        pageCount: 1,
        ocrConfidence: confidence,
        usedOcr: true,
      };
    } finally {
      await worker.terminate().catch(() => undefined);
    }
  }
}
