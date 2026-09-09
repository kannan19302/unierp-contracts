import { z } from "zod";

const id = z.string().trim().min(1);
const instant = z.string().datetime({ offset: true });
export const MAX_CLOSE_SLA_DURATION_MS = 3_155_760_000_000; // 100 elapsed years
const durationMs = z.number().int().positive().max(MAX_CLOSE_SLA_DURATION_MS);

/** Kept separate until the hour-based compatibility adapter is implemented. */
export const LegacyCreateCloseSlaPolicyRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  taskType: z.string().min(1),
  priority: z.string().optional(),
  responseTimeHours: z.number().positive(),
  resolutionTimeHours: z.number().positive(),
  escalationRules: z.unknown().optional(),
  status: z.string().optional(),
}).superRefine((value, context) => {
  const responseMs = value.responseTimeHours * 3_600_000;
  const resolutionMs = value.resolutionTimeHours * 3_600_000;
  if (!Number.isSafeInteger(responseMs) || responseMs > MAX_CLOSE_SLA_DURATION_MS) context.addIssue({
    code: z.ZodIssueCode.custom, path: ["responseTimeHours"], message: "Response duration cannot be represented exactly",
  });
  if (!Number.isSafeInteger(resolutionMs) || resolutionMs > MAX_CLOSE_SLA_DURATION_MS) context.addIssue({
    code: z.ZodIssueCode.custom, path: ["resolutionTimeHours"], message: "Resolution duration cannot be represented exactly",
  });
  if (responseMs > resolutionMs) context.addIssue({
    code: z.ZodIssueCode.custom, path: ["responseTimeHours"], message: "Response must not exceed resolution",
  });
});

const policyTerms = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().max(4000).optional(),
  taskType: id,
  priority: id,
  timeBasis: z.literal("ELAPSED"),
  responseTimeMs: durationMs,
  resolutionTimeMs: durationMs,
  escalationRuleIds: z.array(id).max(100).default([]),
}).strict();

function validTerms(value: z.infer<typeof policyTerms>) {
  return value.responseTimeMs <= value.resolutionTimeMs &&
    new Set(value.escalationRuleIds).size === value.escalationRuleIds.length;
}

export const CreateCloseSlaPolicyRequestSchema = policyTerms.refine(validTerms, {
  message: "Response must precede resolution and escalation rule IDs must be unique",
});
export const ReviseCloseSlaPolicyRequestSchema = policyTerms.extend({
  expectedVersion: z.number().int().positive(),
}).refine(validTerms, {
  message: "Response must precede resolution and escalation rule IDs must be unique",
});
export const RetireCloseSlaPolicyRequestSchema = z.object({
  expectedVersion: z.number().int().positive(),
}).strict();

const assignmentBase = z.object({
  taskId: id,
  startedAt: instant,
  idempotencyKey: z.string().uuid(),
});
const policyAssignment = assignmentBase.extend({
  mode: z.literal("POLICY"),
  policyVersionId: id,
}).strict();
const manualAssignment = assignmentBase.extend({
  mode: z.literal("MANUAL"),
  deadlineAt: instant,
  responseDeadlineAt: instant.optional(),
  priority: id,
}).strict();

export const AssignCloseTaskSlaRequestSchema = z.discriminatedUnion("mode", [
  policyAssignment, manualAssignment,
]).superRefine((value, context) => {
  if (value.mode !== "MANUAL") return;
  const start = Date.parse(value.startedAt);
  const deadline = Date.parse(value.deadlineAt);
  if (deadline <= start) context.addIssue({
    code: z.ZodIssueCode.custom, path: ["deadlineAt"], message: "Deadline must follow the start instant",
  });
  if (value.responseDeadlineAt) {
    const response = Date.parse(value.responseDeadlineAt);
    if (response <= start || response > deadline) context.addIssue({
      code: z.ZodIssueCode.custom, path: ["responseDeadlineAt"],
      message: "Response deadline must follow the start and not exceed the resolution deadline",
    });
  }
});

export const CloseSlaPolicyVersionSchema = policyTerms.extend({
  id, policyId: id, version: z.number().int().positive(), createdAt: instant,
}).refine(validTerms);

export const CloseSlaPolicyListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["ACTIVE", "RETIRED"]).optional(),
}).strict();

export type CreateCloseSlaPolicyRequest = z.infer<typeof CreateCloseSlaPolicyRequestSchema>;
export type ReviseCloseSlaPolicyRequest = z.infer<typeof ReviseCloseSlaPolicyRequestSchema>;
export type RetireCloseSlaPolicyRequest = z.infer<typeof RetireCloseSlaPolicyRequestSchema>;
export type AssignCloseTaskSlaRequest = z.infer<typeof AssignCloseTaskSlaRequestSchema>;
export type CloseSlaPolicyVersion = z.infer<typeof CloseSlaPolicyVersionSchema>;
export type CloseSlaPolicyListQuery = z.infer<typeof CloseSlaPolicyListQuerySchema>;
