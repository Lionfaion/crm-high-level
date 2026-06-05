export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export class EmailService {
  private apiKey = process.env.SENDGRID_API_KEY ?? "";
  private defaultFrom = process.env.SENDGRID_FROM_EMAIL ?? "noreply@example.com";

  async send(msg: EmailMessage): Promise<void> {
    if (!this.apiKey) {
      console.warn("[EmailService] SENDGRID_API_KEY not set — skipping send");
      return;
    }

    const { default: sgMail } = await import("@sendgrid/mail");
    sgMail.setApiKey(this.apiKey);

    await sgMail.send({
      to: msg.to,
      from: { email: msg.from ?? this.defaultFrom, name: msg.fromName ?? "CRM" },
      subject: msg.subject,
      html: msg.html,
      text: msg.text ?? msg.html.replace(/<[^>]+>/g, ""),
    });
  }

  async sendBulk(messages: EmailMessage[]): Promise<void> {
    if (!this.apiKey || !messages.length) return;
    const { default: sgMail } = await import("@sendgrid/mail");
    sgMail.setApiKey(this.apiKey);

    await sgMail.send(
      messages.map((m) => ({
        to: m.to,
        from: { email: m.from ?? this.defaultFrom, name: m.fromName ?? "CRM" },
        subject: m.subject,
        html: m.html,
        text: m.text ?? m.html.replace(/<[^>]+>/g, ""),
      })),
    );
  }

  /** Render Handlebars template with data */
  renderTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ""));
  }
}

export const emailService = new EmailService();
