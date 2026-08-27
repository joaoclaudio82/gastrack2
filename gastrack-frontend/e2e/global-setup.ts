import { chromium, request, type FullConfig } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { API_BASE_URL, TEST_USERS, type TestUserRole } from './config/test-users';

/** Tabelas transacionais zeradas antes do seed (bootstrap — empresa/usuários/endereço/tipos — fica). */
const RESET_TABLES = [
  'contract_addresses',
  'contracts',
  'cylinder_models',
  'cylinders',
  'device_credentials',
  'device_ping_logs',
  'equipment',
  'equipment_kits',
  'gas_points',
  'gas_prices',
  'kit_installations',
  'movement_history',
  'refill_events',
  'user_invitations',
].join(', ');

/**
 * Zera o dado transacional pra um baseline determinístico (estado pré-teste) antes de semear.
 * OPT-IN: só roda se E2E_PG_CONTAINER estiver setado (dev local com Postgres no Docker) — em CI,
 * sem a var, é no-op e não quebra nada.
 */
function resetTransactionalData(): void {
  const container = process.env['E2E_PG_CONTAINER'];
  if (!container) return;
  const db = process.env['E2E_PG_DB'] ?? 'appdb';
  const user = process.env['E2E_PG_USER'] ?? 'postgres';
  try {
    execSync(
      `docker exec ${container} psql -U ${user} -d ${db} -c "TRUNCATE ${RESET_TABLES} RESTART IDENTITY CASCADE;"`,
      { stdio: 'ignore' },
    );
  } catch {
    // best-effort: se falhar, o seed apenas soma ao que já existe
  }
}

/** Mínimos por entidade pra cobrir listagem/paginação nos testes de leitura. */
const MIN_CYLINDERS = 25; // > pageSize -> garante 2ª página
const MIN_KITS = 2;
const MIN_ADDRESSES = 15; // paginação + 1 inativo pra teste de reativar
const SEED_CITY_ID = 1; // cidade do bootstrap (Rio Branco)

/**
 * Seed do dado-base PELO FLUXO REAL (a própria API do backend, como SUPER_ADMIN) — não SQL cru.
 * Idempotente: só cria o que falta. Reusa endereço/modelo existentes. Um seed que falhe não
 * derruba o run (os testes de leitura é que ficam sem dado).
 */
async function seedBaseData(): Promise<void> {
  resetTransactionalData(); // baseline determinístico antes de semear (opt-in via E2E_PG_CONTAINER)
  const ctx = await request.newContext();
  try {
    const login = await ctx.post(`${API_BASE_URL}/auth/login`, {
      data: {
        username: TEST_USERS.SUPER_ADMIN.email,
        password: TEST_USERS.SUPER_ADMIN.password,
      },
    });
    if (!login.ok()) return;
    const { idToken } = (await login.json()) as { idToken: string };
    const headers = { Authorization: `Bearer ${idToken}` };

    // A API crua devolve Spring Page: content[] + totalElements, página 0-indexed, param `size`.
    type Row = { id: number; status?: string };
    const list = async (path: string, size = 20): Promise<{ rows: Row[]; total: number }> => {
      const res = await ctx.get(`${API_BASE_URL}${path}?page=0&size=${size}`, { headers });
      if (!res.ok()) return { rows: [], total: 0 };
      const body = (await res.json()) as { content?: Row[]; totalElements?: number };
      return { rows: body.content ?? [], total: body.totalElements ?? 0 };
    };
    // O backend tem rate-limiter; espaça os POSTs pra não estourar (429) na rajada do seed.
    const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
    const post = async (path: string, data: unknown): Promise<Row | undefined> => {
      const res = await ctx.post(`${API_BASE_URL}${path}`, { headers, data });
      await sleep(120);
      return res.ok() ? ((await res.json()) as Row) : undefined;
    };

    const company = (await list('/companies', 1)).rows[0];
    const address = (await list('/addresses', 1)).rows[0];
    if (!company || !address) return; // sem empresa/endereço não há como escopar por posse

    // --- Endereços: paginação + garantir 1 inativo (endereços persistem ao reset) ---
    const addrTotal = (await list('/addresses', 1)).total;
    for (let i = addrTotal; i < MIN_ADDRESSES; i++) {
      await post('/addresses', {
        companyId: company.id,
        name: `E2E-ADDR-${i}`,
        street: 'Rua E2E',
        number: `${i}`,
        cityId: SEED_CITY_ID,
        zipCode: '01000-000',
        contractIds: [],
      });
    }
    const addrs = (await list('/addresses', 50)).rows as (Row & { active?: boolean })[];
    if (!addrs.some((a) => a.active === false)) {
      const victim = addrs.find((a) => a.id !== address.id);
      if (victim) await ctx.post(`${API_BASE_URL}/addresses/${victim.id}/deactivate`, { headers });
    }

    // --- Cilindros: modelo + N cilindros ---
    let model = (await list('/cylinder-models', 1)).rows[0];
    model ??= await post('/cylinder-models', {
      codigo: 'E2E-GN-50',
      gasType: 'GN',
      waterVolumeLiters: 50,
      capacityBar: 200,
    });
    if (model) {
      const have = (await list('/cylinders', 1)).total;
      for (let i = have; i < MIN_CYLINDERS; i++) {
        await post('/cylinders', {
          cylinderModelId: model.id,
          addressId: address.id,
          serialNumber: `E2E-CYL-${i}-${Date.now()}`,
        });
      }
    }

    // --- Contrato ACTIVE (kits exigem contrato ativo) ---
    let contract = (await list('/contracts')).rows.find((c) => c.status === 'ACTIVE');
    if (!contract) {
      const created = await post('/contracts', {
        companyId: company.id,
        startDate: '2026-01-01',
        kitQuantity: 50,
        allowedAddressIds: [address.id],
        addressIds: [address.id],
      });
      if (created) {
        await ctx.patch(`${API_BASE_URL}/contracts/${created.id}/status`, {
          headers,
          data: { status: 'ACTIVE' },
        });
        contract = created;
      }
    }

    // --- Kits (no contrato ativo) ---
    if (contract) {
      const have = (await list('/equipment-kits', 1)).total;
      for (let i = have; i < MIN_KITS; i++) {
        await post('/equipment-kits', {
          contractId: contract.id,
          kitCode: `E2E-KIT-${i}-${Date.now()}`,
        });
      }
    }

    // --- Composição real do 1º kit: 1 ESP32 (gateway, com serial) + 1 sensor ---
    const types = (await list('/equipment-types', 50)).rows as (Row & { name?: string })[];
    const isEsp = (name?: string): boolean => (name ?? '').toUpperCase().includes('ESP32');
    const espType = types.find((t) => isEsp(t.name));
    const sensorType = types.find((t) => !isEsp(t.name));
    const kit = (await list('/equipment-kits', 1)).rows[0];
    if (kit && espType && sensorType) {
      const byKit = await ctx.get(`${API_BASE_URL}/equipment/by-kit/${kit.id}?page=0&size=50`, {
        headers,
      });
      const kitEquip = byKit.ok()
        ? (((await byKit.json()) as { content?: { equipmentTypeName?: string }[] }).content ?? [])
        : [];
      if (!kitEquip.some((e) => isEsp(e.equipmentTypeName))) {
        // ESP32 exige serial; é o gateway que a troca de ESP precisa
        await post('/equipment', {
          equipmentKitId: kit.id,
          equipmentTypeId: espType.id,
          assetTag: `E2E-ESP-${Date.now()}`,
          serialNumber: `ESP-SN-${Date.now()}`,
        });
      }
      if (!kitEquip.some((e) => !isEsp(e.equipmentTypeName))) {
        await post('/equipment', {
          equipmentKitId: kit.id,
          equipmentTypeId: sensorType.id,
          assetTag: `E2E-SEN-${Date.now()}`,
        });
      }
    }

    // --- Instala esse kit (kit-detail e manutenção exigem INSTALLED; precisa ter equipamento) ---
    const kits = (await list('/equipment-kits')).rows;
    if (kit && !kits.some((k) => k.status === 'INSTALLED')) {
      await ctx.post(`${API_BASE_URL}/equipment-kits/${kit.id}/install`, {
        headers,
        data: { addressId: address.id },
      });
    }
  } catch {
    // seed é best-effort; segue o run
  } finally {
    await ctx.dispose();
  }
}

/** Caminho do storageState salvo por papel (reusado pelas fixtures). */
export function authStatePath(role: TestUserRole): string {
  return `e2e/.auth/${role}.json`;
}

/**
 * Autentica UMA vez por papel via UI e salva o storageState (tokens no localStorage).
 * As fixtures reusam esse estado em vez de logar por teste — sem isso, 200+ logins reais
 * estouram o rate-limit do Cognito (InitiateAuth → HTTP 429).
 *
 * Roda depois do webServer subir. Usa o mesmo browser do projeto via PW_CHANNEL
 * (vazio = Chromium empacotado; "chrome" = Chrome do sistema, sem download).
 */
async function globalSetup(config: FullConfig): Promise<void> {
  mkdirSync('e2e/.auth', { recursive: true });

  const project = config.projects[0];
  const baseURL = project?.use.baseURL ?? 'http://localhost:4200';
  const channel = process.env['PW_CHANNEL']; // vazio/undefined => Chromium empacotado

  const browser = await chromium.launch(channel ? { channel } : {});
  try {
    for (const role of ['USER', 'ADMIN', 'SUPER_ADMIN'] as TestUserRole[]) {
      const user = TEST_USERS[role];
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();

      await page.goto('/auth/login');
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Senha').fill(user.password);
      await page.getByRole('button', { name: 'Entrar' }).click();
      await page.waitForURL(/\/dashboard/, { timeout: 20000 });

      await context.storageState({ path: authStatePath(role) });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  await seedBaseData();
}

export default globalSetup;
