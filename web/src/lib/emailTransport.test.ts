import net from 'node:net'

import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { Payload } from 'payload'
import { afterEach, describe, expect, it } from 'vitest'

// Почтовый путь проверяется фактом доставки, а не «адаптер вернул объект».
// Повод — сессия 15: кнопка «Забыли пароль?» была бесполезна, пока не появился
// адаптер, и это обнаружилось только на живом SMTP; локально почты не было, и
// диагностика стоила двух неверных гипотез. Здесь почта есть — локальный сток,
// который говорит по SMTP и помнит, что ему прислали.
//
// Сток — это одновременно и приёмка, и отрицательный контроль: тест обязан
// краснеть, когда письмо НЕ доходит (см. последний кейс). Проверка, которая
// зеленеет всегда, ничего не проверяет.

type SinkState = {
  server: net.Server
  port: number
  dialogue: string[]
  messages: string[]
  rejectAuth: boolean
}

async function startSink(rejectAuth = false): Promise<SinkState> {
  const state: SinkState = {
    server: net.createServer(),
    port: 0,
    dialogue: [],
    messages: [],
    rejectAuth,
  }

  state.server.on('connection', (socket) => {
    let inData = false
    let buffer = ''
    let current = ''

    const write = (line: string) => {
      state.dialogue.push('S: ' + line)
      socket.write(line + '\r\n')
    }

    write('220 localhost ESMTP sink')

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      let eol = buffer.indexOf('\r\n')
      while (eol !== -1) {
        const line = buffer.slice(0, eol)
        buffer = buffer.slice(eol + 2)

        if (inData) {
          if (line === '.') {
            inData = false
            state.messages.push(current)
            current = ''
            write('250 2.0.0 Ok: queued as TESTMSG')
          } else {
            current += line + '\n'
          }
          eol = buffer.indexOf('\r\n')
          continue
        }

        state.dialogue.push('C: ' + line)
        const verb = line.toUpperCase()
        if (verb.startsWith('EHLO') || verb.startsWith('HELO')) {
          write('250-localhost')
          write('250-AUTH PLAIN LOGIN')
          write('250 8BITMIME')
        } else if (verb.startsWith('AUTH')) {
          write(state.rejectAuth ? '535 5.7.8 Authentication credentials invalid' : '235 2.7.0 ok')
        } else if (verb.startsWith('MAIL FROM')) {
          write('250 2.1.0 Ok')
        } else if (verb.startsWith('RCPT TO')) {
          write('250 2.1.5 Ok')
        } else if (verb === 'DATA') {
          inData = true
          write('354 End data with <CR><LF>.<CR><LF>')
        } else if (verb === 'QUIT') {
          write('221 2.0.0 Bye')
          socket.end()
        } else {
          write('250 2.0.0 Ok')
        }
        eol = buffer.indexOf('\r\n')
      }
    })
    socket.on('error', () => {
      /* обрыв — это часть сценария отказа, глотаем */
    })
  })

  await new Promise<void>((resolve) => state.server.listen(0, '127.0.0.1', resolve))
  const address = state.server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('SMTP-сток не получил порт')
  }
  state.port = address.port
  return state
}

async function sendThroughAdapter(
  port: number,
  pass: string,
): Promise<{ accepted: string[]; envelope: { from: string; to: string[] } }> {
  const factory = await nodemailerAdapter({
    defaultFromAddress: 'noreply@example.invalid',
    defaultFromName: 'Сток',
    // skipVerify: true — как на проде: адаптер не должен проверять связь при старте,
    // иначе недоступный SMTP не дал бы подняться сайту.
    skipVerify: true,
    transportOptions: {
      host: '127.0.0.1',
      port,
      secure: false,
      ignoreTLS: true,
      auth: { user: 'tester@example.invalid', pass },
    } as TransportOptions,
  })
  // Адаптер — фабрика: `factory({ payload })` отдаёт объект с sendEmail. Вызов
  // factory без аргумента — ошибка типов; payload здесь можно пустым, адаптер к
  // нему не обращается (он строит транспорт из своих аргументов), и база нам в
  // этом тесте не нужна.
  const adapter = await factory({ payload: {} as unknown as Payload })
  const info = await adapter.sendEmail({
    to: 'recipient@example.invalid',
    subject: 'Проверка почтового пути',
    html: '<p>письмо дошло до стока</p>',
  })
  return info as unknown as { accepted: string[]; envelope: { from: string; to: string[] } }
}

let sink: SinkState | undefined

// Тот же приём, что в `payload.config.ts`: nodemailer 10 не объявляет `auth` в своих
// декларациях, хотя транспорт это поле читает.
type TransportOptions = NonNullable<
  NonNullable<Parameters<typeof nodemailerAdapter>[0]>['transportOptions']
>

afterEach(async () => {
  if (sink) {
    await new Promise<void>((resolve) => sink!.server.close(() => resolve()))
    sink = undefined
  }
})

describe('почтовый путь целиком (nodemailer → SMTP)', () => {
  it('доставляет письмо: аутентификация, конверт, тело на месте', async () => {
    sink = await startSink()

    const info = await sendThroughAdapter(sink.port, 'app-password')

    expect(sink.messages).toHaveLength(1)
    const [raw] = sink.messages
    // Заголовок приходит в encoded-words, поэтому ищем по признаку кодировки, а не
    // по русскому тексту: текст в теле тоже base64.
    expect(raw).toContain('Subject: =?UTF-8?B?')
    expect(raw).toContain('Message-ID:')
    expect(raw).toContain('Content-Type: text/html; charset=utf-8')
    // Тело доставлено в base64 — декодируем и смотрим, что это наш текст.
    const encoded = raw.split('Content-Transfer-Encoding: base64')[1] ?? ''
    const body = Buffer.from(encoded.split('\n\n')[1] ?? '', 'base64').toString('utf8')
    expect(body).toContain('письмо дошло до стока')
    expect(info.accepted).toEqual(['recipient@example.invalid'])
    expect(info.envelope.from).toBe('noreply@example.invalid')
  })

  it('диалог по проводу полный: EHLO → AUTH PLAIN → MAIL FROM → RCPT TO → DATA', async () => {
    sink = await startSink()
    await sendThroughAdapter(sink.port, 'app-password')

    const commands = sink.dialogue.filter((line) => line.startsWith('C: '))
    const verbs = commands.map((line) => line.slice(3).split(' ')[0].toUpperCase())
    expect(verbs).toContain('EHLO')
    expect(verbs).toContain('AUTH')
    expect(verbs).toContain('MAIL')
    expect(verbs).toContain('RCPT')
    expect(verbs).toContain('DATA')
    // AUTH PLAIN, а не XOAUTH2: у Яндекса пароль приложения, OAUTH2-токена нет.
    expect(commands.some((line) => line.includes('AUTH PLAIN'))).toBe(true)
  })

  it('отказ сервера виден наружу, а не съедается молча (отрицательный контроль)', async () => {
    sink = await startSink(true)

    await expect(sendThroughAdapter(sink.port, 'wrong-password')).rejects.toThrow()

    // Главное здесь — вторая строка: без неё тест проходит и тогда, когда сток
    // ничего не получил бы вовсе, то есть проверяет сам себя и ничего.
    expect(sink.messages).toHaveLength(0)
  })
})