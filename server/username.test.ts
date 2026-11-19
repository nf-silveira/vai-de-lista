import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isValidUsername, usernameFromEmail } from '../shared/username.js'

describe('isValidUsername', () => {
  it('aceita letras, números, ponto e underscore', () => {
    assert.equal(isValidUsername('felipe'), true)
    assert.equal(isValidUsername('felipe.santos'), true)
    assert.equal(isValidUsername('lista_da_casa2'), true)
    assert.equal(isValidUsername('  FElipe  '), true)
  })

  it('rejeita nick curto, longo ou com caracteres inválidos', () => {
    assert.equal(isValidUsername('ab'), false)
    assert.equal(isValidUsername('a'.repeat(21)), false)
    assert.equal(isValidUsername('felipe santos'), false)
    assert.equal(isValidUsername('felipe@casa'), false)
    assert.equal(isValidUsername(''), false)
  })
})

describe('usernameFromEmail', () => {
  it('usa a parte local normalizada do e-mail', () => {
    assert.equal(usernameFromEmail('Felipe.Santos@exemplo.com'), 'felipe.santos')
    assert.equal(usernameFromEmail('casa+lista@exemplo.com'), 'casalista')
  })

  it('devolve um nick válido quando a parte local é curta', () => {
    const nick = usernameFromEmail('a@exemplo.com')

    assert.equal(nick, 'usera')
    assert.equal(isValidUsername(nick), true)
  })
})
