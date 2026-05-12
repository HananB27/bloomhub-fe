declare module "mammoth" {
  export interface MammothMessage {
    type: "warning" | "error" | "info" | string;
    message: string;
  }
  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }
  export interface MammothInput {
    arrayBuffer?: ArrayBuffer;
    buffer?: ArrayBuffer | Uint8Array;
    path?: string;
  }
  export interface MammothOptions {
    styleMap?: string[] | string;
    includeDefaultStyleMap?: boolean;
    includeEmbeddedStyleMap?: boolean;
    convertImage?: unknown;
    ignoreEmptyParagraphs?: boolean;
    idPrefix?: string;
    transformDocument?: unknown;
  }
  export function convertToHtml(
    input: MammothInput,
    options?: MammothOptions
  ): Promise<MammothResult>;
  export function extractRawText(input: MammothInput): Promise<MammothResult>;

  const _default: {
    convertToHtml: typeof convertToHtml;
    extractRawText: typeof extractRawText;
  };
  export default _default;
}
