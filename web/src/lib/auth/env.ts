import { esaConfig, type EsaConfig } from './oidc'
import { ensureSecret } from './vault'

// Конфиг клиента ЕСА для рантайма.
//
// `client_secret` — единственный секрет в контуре входа. Он живёт в комнате
// КАРМАНА (выпущен Сарафаном, grant id=16), и на боксе его достаёт до-тяг при
// первом обращении (см. `vault.ts` и письмо brain 13.10: «значение → в env
// юнита, права 600, не в git и не в GitHub Secrets»).
//
// ⚠️ Значение в лог не попадает НИКОГДА: ensureSecret печатает только имена
// ключей и коды ответов (ADR-0006, свойство 7).
export const esaEnv = async (): Promise<EsaConfig | null> => {
  await ensureSecret('ESA_CLIENT_SECRET_KAZANSKAYA')
  return esaConfig()
}
