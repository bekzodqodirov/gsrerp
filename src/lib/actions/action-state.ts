import { ZodError, ZodType } from "zod";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export function parseOrError<T>(
  schema: ZodType<T>,
  data: Record<string, unknown>
): { data: T; error?: undefined } | { data?: undefined; error: ActionState } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data };
  }
  const fieldErrors: Record<string, string> = {};
  for (const issue of (result.error as ZodError).issues) {
    const key = issue.path.join(".") || "_form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: { error: "Ma'lumotlarni tekshiring", fieldErrors } };
}

export function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value === "") continue;
    obj[key] = value;
  }
  return obj;
}
