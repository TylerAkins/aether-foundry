import "server-only";

import { Resend } from "resend";

import { appEnv } from "@/lib/env/app";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type EmailProvider = {
  send(message: EmailMessage): Promise<void>;
};

class ResendEmailProvider implements EmailProvider {
  private readonly resend = new Resend(appEnv.RESEND_API_KEY);

  async send(message: EmailMessage): Promise<void> {
    const result = await this.resend.emails.send({
      from: appEnv.AUTH_EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  }
}

class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.info("Auth email generated.", {
      to: message.to,
      subject: message.subject,
    });
  }
}

export function getEmailProvider(): EmailProvider {
  if (appEnv.APP_ENV === "production") {
    return new ResendEmailProvider();
  }

  return new ConsoleEmailProvider();
}
