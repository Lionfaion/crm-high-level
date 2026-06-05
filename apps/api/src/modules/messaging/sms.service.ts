export class SmsService {
  private accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  private authToken  = process.env.TWILIO_AUTH_TOKEN  ?? "";
  private fromPhone  = process.env.TWILIO_PHONE_NUMBER ?? "";

  private get client() {
    if (!this.accountSid || !this.authToken) return null;
    // Lazy import to avoid startup errors when credentials are absent
    const twilio = require("twilio");
    return twilio(this.accountSid, this.authToken);
  }

  async send(to: string, body: string, from?: string): Promise<string | null> {
    const client = this.client;
    if (!client) {
      console.warn("[SmsService] Twilio credentials not set — skipping SMS");
      return null;
    }
    const msg = await client.messages.create({
      to,
      from: from ?? this.fromPhone,
      body,
    });
    return msg.sid;
  }

  async sendBulk(recipients: { to: string; body: string }[], from?: string): Promise<void> {
    await Promise.allSettled(recipients.map((r) => this.send(r.to, r.body, from)));
  }
}

export const smsService = new SmsService();
