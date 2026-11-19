import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_RESET_EMAIL_FROM,
  createPasswordResetEmailSender,
  type PasswordResetEmail,
} from './passwordResetEmail.js'

function fakeClient(error: { message: string } | null = null) {
  const sent: PasswordResetEmail[] = []

  return {
    sent,
    client: {
      emails: {
        send: async (email: PasswordResetEmail) => {
          sent.push(email)
          return { error }
        },
      },
    },
  }
}

const link = 'http://localhost:5174/api/auth/reset-password/abc?callbackURL=/redefinir-senha'

describe('createPasswordResetEmailSender', () => {
  it('em dev, sem cliente, registra o link e não envia e-mail', async () => {
    const warnings: string[] = []
    const send = createPasswordResetEmailSender({
      client: null,
      from: '',
      isProduction: false,
      warn: (message) => warnings.push(message),
    })

    await send('pessoa@exemplo.com', link)

    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /RESEND_API_KEY ausente/)
    assert.ok(warnings[0].includes(link))
  })

  it('em produção, sem cliente, falha em vez de fingir que enviou', async () => {
    const send = createPasswordResetEmailSender({
      client: null,
      from: 'Vai de Lista <nao-responda@vaidelista.app>',
      isProduction: true,
    })

    await assert.rejects(send('pessoa@exemplo.com', link), /RESEND_API_KEY/)
  })

  it('em produção, sem remetente configurado, não chama o Resend', async () => {
    const { client, sent } = fakeClient()
    const send = createPasswordResetEmailSender({ client, from: '', isProduction: true })

    await assert.rejects(send('pessoa@exemplo.com', link), /RESET_EMAIL_FROM/)
    assert.equal(sent.length, 0)
  })

  it('envia pelo remetente configurado com o link no corpo', async () => {
    const { client, sent } = fakeClient()
    const send = createPasswordResetEmailSender({
      client,
      from: 'Vai de Lista <nao-responda@vaidelista.app>',
      isProduction: true,
    })

    await send('pessoa@exemplo.com', link)

    assert.equal(sent.length, 1)
    assert.equal(sent[0].from, 'Vai de Lista <nao-responda@vaidelista.app>')
    assert.equal(sent[0].to, 'pessoa@exemplo.com')
    assert.equal(sent[0].subject, 'Redefinir sua senha')
    assert.match(sent[0].text, /expira em 1 hora/)
    assert.ok(sent[0].text.includes(link))
  })

  it('em dev, com cliente e sem remetente, usa o remetente de teste', async () => {
    const { client, sent } = fakeClient()
    const send = createPasswordResetEmailSender({ client, from: '', isProduction: false })

    await send('pessoa@exemplo.com', link)

    assert.equal(sent[0].from, DEFAULT_RESET_EMAIL_FROM)
  })

  it('propaga o erro do Resend', async () => {
    const { client } = fakeClient({ message: 'domínio não verificado' })
    const send = createPasswordResetEmailSender({
      client,
      from: 'Vai de Lista <nao-responda@vaidelista.app>',
      isProduction: true,
    })

    await assert.rejects(send('pessoa@exemplo.com', link), /domínio não verificado/)
  })
})
