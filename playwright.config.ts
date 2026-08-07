import { defineConfig, devices } from '@playwright/test'

/**
 * Le harnais de navigateur RÉEL — c'est lui que la porte P-04 pilote.
 *
 * ⚠️ DEUX MOTEURS, ET CE N'EST PAS NÉGOCIABLE. Une PWA s'exécute dans le
 * navigateur réel de l'utilisateur : Chromium sur Android et sur les postes
 * Windows, **WebKit sur tout iPhone et iPad, sans exception possible** — iOS
 * impose WebKit à tous les navigateurs. Tester sur Chromium seul, c'est ne pas
 * tester la moitié du parc, et la moitié la plus contrainte.
 *
 * ⚠️ AUCUN CONTENEUR. Le serveur est le build lui-même, servi par node. C'est ce
 * qui rend la vérification exécutable sur le poste d'Abengourou, où P-01, P-02
 * et P-05 ne le sont pas.
 */

const PORT = Number(process.env.KAYA_PORT ?? 3000)
const BASE = process.env.KAYA_BASE_URL ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/navigateur',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: process.env.KAYA_RAPPORT_PLAYWRIGHT === 'liste' ? 'list' : [['line']],
  outputDir: '.rapports/navigateur',

  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Le serveur n'est pas relancé quand il tourne déjà : la porte P-04 le monte
  // une fois pour toute la matrice, plutôt qu'une fois par projet.
  webServer: {
    command: 'node .output/server/index.mjs',
    url: BASE,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { PORT: String(PORT), NITRO_PORT: String(PORT), HOST: '127.0.0.1' },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
