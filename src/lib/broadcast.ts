export function weeklyBroadcastDraft(input: { from: string; segmentId: string; subject: string; text: string }) {
  if (!input.text.includes("{{{RESEND_UNSUBSCRIBE_URL}}}")) {
    throw new Error("missing_unsubscribe");
  }
  return {
    name: input.subject,
    from: input.from,
    subject: input.subject,
    text: input.text,
    segmentId: input.segmentId,
    send: false as const,
  };
}
