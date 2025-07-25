import { z } from 'zod';

// popup → content
export const RequestHtmlSchema = z.object({
  type: z.literal('requestHtml'),
});
export type RequestHtml = z.infer<typeof RequestHtmlSchema>;

// content → popup
export const HtmlResponseSchema = z.object({
  type: z.literal('html'),
  html: z.string(),
});
export type HtmlResponse = z.infer<typeof HtmlResponseSchema>;

// popup → bg
export const StyleRequestSchema = z.object({
  type: z.literal('style'),
  html: z.string(),
  styleName: z.string(),
  tabId: z.number().optional(),
});
export type StyleRequest = z.infer<typeof StyleRequestSchema>;

// bg → popup
export const ProgressSchema = z.object({
  type: z.literal('progress'),
  message: z.string().optional(),
  error: z.string().optional(),
});
export type Progress = z.infer<typeof ProgressSchema>;

// bg → content
export const ApplyPatchSchema = z.object({
  type: z.literal('applyPatch'),
  css: z.string(),
  patches: z
    .array(
      z.object({
        selector: z.string(),
        replace: z.string(),
        outer: z.boolean().optional(),
      })
    )
    .optional(),
});
export type ApplyPatch = z.infer<typeof ApplyPatchSchema>;

// content → bg
export const AckSchema = z.object({
  type: z.literal('ack'),
  success: z.boolean().optional(),
  error: z.string().optional(),
});
export type Ack = z.infer<typeof AckSchema>;

// Union типов для удобства
export const MessageSchema = z.union([
  RequestHtmlSchema,
  HtmlResponseSchema,
  StyleRequestSchema,
  ProgressSchema,
  ApplyPatchSchema,
  AckSchema,
]);
export type Message =
  | RequestHtml
  | HtmlResponse
  | StyleRequest
  | Progress
  | ApplyPatch
  | Ack;

// Утилита для валидации
export function parseMessage(data: unknown): Message | null {
  const result = MessageSchema.safeParse(data);
  return result.success ? result.data : null;
} 