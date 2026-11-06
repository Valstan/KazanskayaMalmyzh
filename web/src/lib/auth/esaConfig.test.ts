import { afterEach, describe, expect, it, vi } from 'vitest'

import { ESA_CLIENT_ID, ESA_ISSUER, ESA_REDIRECT_URI, esaConfig } from './oidc'

// Имя, под которым комната отдаёт значение, и имя, которое читает конфиг, —
// это ДВА разных имени в коде, и расхождение между ними молча убивало вход:
// `ensureSecret` наполнял `ESA_CLIENT_SECRET_KAZANSKAYA`, а конфиг читал
// `ESA_CLIENT_SECRET` → `esaConfig()` возвращал null → «auth=unavailable».
// Тест держит оба имени на виду (замерено 06.11 на проде).

describe('esaConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('читает секрет под именем, которым наполняет комната', () => {
    vi.stubEnv('ESA_CLIENT_SECRET_KAZANSKAYA', 'value-from-room')
    const cfg = esaConfig()
    expect(cfg).not.toBeNull()
    expect(cfg?.clientSecret).toBe('value-from-room')
    expect(cfg?.clientId).toBe(ESA_CLIENT_ID)
    expect(cfg?.issuer).toBe(ESA_ISSUER)
    expect(cfg?.redirectUri).toBe(ESA_REDIRECT_URI)
  })

  it('принимает и старое имя — оператор мог задать секрет руками', () => {
    vi.stubEnv('ESA_CLIENT_SECRET', 'value-from-env-file')
    expect(esaConfig()?.clientSecret).toBe('value-from-env-file')
  })

  it('имя из комнаты сильнее старого', () => {
    vi.stubEnv('ESA_CLIENT_SECRET_KAZANSKAYA', 'value-from-room')
    vi.stubEnv('ESA_CLIENT_SECRET', 'value-from-env-file')
    expect(esaConfig()?.clientSecret).toBe('value-from-room')
  })

  it('без секрета входа нет — fail-closed', () => {
    // Пустыми, а не «нет переменной»: на машине разработчика переменная может
    // быть задана, и тест обязан проверять контракт, а не окружение.
    vi.stubEnv('ESA_CLIENT_SECRET_KAZANSKAYA', '')
    vi.stubEnv('ESA_CLIENT_SECRET', '')
    expect(esaConfig()).toBeNull()
  })
})
