import type { SavedTemplate, WorkerProfile } from "./types";

export function defaultTemplates(profile: WorkerProfile): SavedTemplate[] {
  const name = profile.name || "Worker";
  const platform = profile.platform || "the platform";
  const now = new Date().toISOString();

  return [
    {
      id: "tpl-grievance",
      kind: "grievance",
      title: "Pay shortfall grievance",
      body: `Subject: Request to resolve missing / short payment

Hello Support,

My name is ${name}. I work on ${platform} in ${profile.city || "my city"}.

On [DATE], order/trip ID [ID], I expected ₹[AMOUNT] but received ₹[PAID].

I have attached screenshots. Please review and credit the difference.

Thank you,
${name}
Phone: [YOUR NUMBER]`,
      updatedAt: now,
    },
    {
      id: "tpl-leave",
      kind: "leave",
      title: "Unavailable / leave message",
      body: `Hello,

I am ${name}. I will be unavailable on [DATE] from [FROM] to [TO] due to [REASON].

I will resume work after that. Thank you for understanding.

${name}`,
      updatedAt: now,
    },
    {
      id: "tpl-customer",
      kind: "customer",
      title: "Polite customer reply",
      body: `Hello,

Thank you for your patience. I am on the way / working on your order.

If there is any issue with the order, please tell me and I will help through the app support as well.

Regards,
${name}`,
      updatedAt: now,
    },
  ];
}
