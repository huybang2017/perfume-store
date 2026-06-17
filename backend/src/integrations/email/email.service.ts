import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('smtp.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get<number>('smtp.port'),
        auth: {
          user: config.get<string>('smtp.user'),
          pass: config.get<string>('smtp.pass'),
        },
      });
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!this.transporter) return;
    await this.transporter.sendMail({
      from: this.config.get<string>('smtp.from'),
      to,
      subject,
      html,
    });
  }
}
