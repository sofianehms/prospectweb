import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.RESEND_API_KEY = 'test_key';
process.env.RESEND_FROM = 'Nosite <test@nosite.fr>';

const mockSend = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

import {
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendInvoiceEmail,
  sendPlanExpirationEmail,
  sendQuotaReachedEmail,
  sendPaymentFailedEmail,
} from '../services/emailService';

describe('M9.6 -- Emails transactionnels Resend', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ error: null });
  });

  it('sendWelcomeEmail envoie avec le bon sujet et destinataire', async () => {
    await sendWelcomeEmail('user@test.com', 'Sofiane');
    expect(mockSend).toHaveBeenCalledOnce();
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe('user@test.com');
    expect(call.subject).toBe('Bienvenue sur Nosite');
    expect(call.html).toContain('Sofiane');
  });

  it('sendPaymentConfirmationEmail contient le nom du plan', async () => {
    await sendPaymentConfirmationEmail('user@test.com', 'Pro', '29,00 EUR');
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('Pro');
    expect(call.html).toContain('Pro');
    expect(call.html).toContain('29,00 EUR');
  });

  it('sendInvoiceEmail contient le montant et le lien', async () => {
    await sendInvoiceEmail('user@test.com', '29,00 EUR', 'https://stripe.com/invoice/123');
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('29,00 EUR');
    expect(call.html).toContain('https://stripe.com/invoice/123');
  });

  it('sendInvoiceEmail sans lien ne crash pas', async () => {
    await sendInvoiceEmail('user@test.com', '29,00 EUR', null);
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it('sendPlanExpirationEmail contient le nom du plan', async () => {
    await sendPlanExpirationEmail('user@test.com', 'Pro');
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('Pro');
    expect(call.html).toContain('expire');
  });

  it('sendQuotaReachedEmail contient usage et limite', async () => {
    await sendQuotaReachedEmail('user@test.com', 300, 300);
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('Quota');
    expect(call.html).toContain('300/300');
  });

  it('sendPaymentFailedEmail contient le montant et le motif', async () => {
    await sendPaymentFailedEmail('user@test.com', '29,00 EUR', 'Card declined');
    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain('Echec');
    expect(call.html).toContain('Card declined');
    expect(call.html).toContain('29,00 EUR');
  });

  it('un echec Resend est journalise sans bloquer', async () => {
    mockSend.mockResolvedValue({ error: { message: 'Rate limited' } });
    await expect(sendWelcomeEmail('user@test.com', 'Test')).resolves.toBeUndefined();
  });

  it('une exception Resend est capturee sans bloquer', async () => {
    mockSend.mockRejectedValue(new Error('Network error'));
    await expect(sendWelcomeEmail('user@test.com', 'Test')).resolves.toBeUndefined();
  });
});
