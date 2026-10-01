export type OcrDocumentInput = { documentType: string; storageRef: string; familyId: string; memberId?: string; consentAt: string };
export type OcrResult = { provider: string; fields: Record<string,string>; confidence: Record<string,number>; status: 'completed'|'manual_review'|'failed' };
export interface OcrProvider { extract(input: OcrDocumentInput): Promise<OcrResult>; }
export function getOcrProvider(): OcrProvider | null {
  // Provider is deliberately server-side. Add the selected OCR vendor here and keep its API key in Hostinger.
  return null;
}
