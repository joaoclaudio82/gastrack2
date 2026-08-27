import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mapa de mensagens conhecidas do backend para um texto PT-BR acionável.
 * Chave: mensagem crua retornada pela API (case-sensitive).
 */
const KNOWN_BACKEND_MESSAGES_PT_BR: Record<string, string> = {
  // Empresa
  // 409 de constraint que escapou do pré-check (duas gravações simultâneas do mesmo valor).
  'The resource conflicts with an existing record.':
    'Este registro conflita com outro já existente. Recarregue a página e confira os dados.',
  'Company with this slug already exists': 'Já existe uma empresa com este slug.',
  'Company with this CNPJ already exists': 'Já existe uma empresa com este CNPJ.',
  // Endereço × contrato
  'Address is not enabled for this contract':
    'O endereço selecionado não está habilitado para este contrato.',
  'Address must belong to the same company as the contract':
    'O endereço deve pertencer à mesma empresa do contrato.',
  'Contract must belong to the same company as the address.':
    'O contrato deve pertencer à mesma empresa do endereço.',
  'At least one address must be selected': 'Selecione pelo menos um endereço.',
  // Contrato
  'End date must be after start date': 'A data de término deve ser posterior à data de início.',
  'Contract has expired': 'O contrato está expirado.',
  'Contract must be ACTIVE to add kits': 'O contrato precisa estar ATIVO para adicionar kits.',
  'Contract must be ACTIVE to install kit': 'O contrato precisa estar ATIVO para instalar o kit.',
  // Migração / troca de kit
  'cross-company move nao permitido; use remover + reinstalar':
    'Não é possível migrar um kit entre empresas. Remova o kit e reinstale na empresa de destino.',
  'Sensor not found in kit or not active': 'Sensor não encontrado no kit ou inativo.',
  // Kit / instalação
  'Cannot install inactive kit': 'Não é possível instalar um kit inativo.',
  'Cannot install kit at inactive address': 'Não é possível instalar o kit em um endereço inativo.',
  'Kit must have at least one equipment to be installed':
    'O kit precisa de ao menos um equipamento para ser instalado.',
  'Kit does not belong to the provided address': 'O kit não pertence ao endereço informado.',
  'Installation date cannot be before contract start date':
    'A data de instalação não pode ser anterior ao início do contrato.',
  'Installation date cannot be after contract end date':
    'A data de instalação não pode ser posterior ao término do contrato.',
  // Equipamentos
  'An active ESP32 with this serial number already exists':
    'Já existe um ESP32 ativo com este número de série.',
  'Equipment with this asset tag already exists':
    'Já existe um equipamento com esta etiqueta de patrimônio.',
  'Equipment kit with this kit code already exists': 'Já existe um kit com este código.',
  'Equipment is already assigned to a kit. Remove it first or use transfer.':
    'O equipamento já está atribuído a um kit. Remova-o primeiro ou use a transferência.',
  'Serial number is required for ESP32 equipment':
    'Número de série é obrigatório para equipamentos ESP32.',
  'Serial number is only allowed for ESP32 equipment':
    'Número de série só é permitido para equipamentos ESP32.',
  'Kit already has an active ESP32; a kit supports exactly one ESP32 (kit = 1 ESP)':
    'Este kit já tem um ESP32; um kit comporta exatamente um gateway. Use "Trocar ESP" para substituí-lo.',
  // Cilindros
  'Cylinder with this Serial number already exists':
    'Já existe um cilindro com este número de série.',
  // Pontos de gás
  'Each gas point can have at most one sensor': 'Cada ponto de gás pode ter no máximo um sensor.',
  'Only active equipment can be associated to a gas point':
    'Apenas equipamentos ativos podem ser associados a um ponto de gás.',
  'sensorPort must be between 1 and 8': 'A porta do sensor deve estar entre 1 e 8.',
};

/**
 * Mensagens conhecidas cujo texto carrega um trecho dinâmico (ex.: uma contagem),
 * casadas por prefixo. Ex.: "Contract has reached its maximum number of kits (1)".
 */
const KNOWN_BACKEND_MESSAGE_PREFIXES_PT_BR: readonly [string, string][] = [
  [
    'Contract has reached its maximum number of kits',
    'Este contrato já atingiu o limite de kits permitido.',
  ],
  ['Rate limit exceeded', 'Limite de requisições excedido. Aguarde um momento e tente novamente.'],
  [
    // "Gas point already has cylinders of gas type O2; cannot mix with N2" — os gases variam.
    'Gas point already has cylinders of gas type',
    'Esta linha já opera com outro gás. Não é possível misturar gases no mesmo manifold.',
  ],
  ['PontoGas not found', 'Ponto de gás não encontrado.'],
];

/**
 * Códigos estáveis do backend (`ErrorCodes`), que não mudam quando a mensagem é reescrita.
 * O texto continua valendo como fallback para todo erro que ainda não tem código.
 */
const KNOWN_ERROR_CODES_PT_BR: Record<string, string> = {
  GAS_TYPE_MISMATCH:
    'Esta linha já opera com outro gás. Não é possível misturar gases no mesmo manifold.',
  CYLINDER_SERIAL_DUPLICATE: 'Já existe um cilindro com este número de série.',
};

function readErrorCode(error: unknown): string | null {
  const body =
    error instanceof HttpErrorResponse
      ? error.error
      : (error as { error?: unknown } | null | undefined)?.error;

  if (body && typeof body === 'object' && 'errorCode' in body) {
    const code = (body as { errorCode?: unknown }).errorCode;
    if (typeof code === 'string' && code.trim().length > 0) return code;
  }
  return null;
}

/**
 * Extrai a mensagem de erro do corpo de uma resposta de API e, quando conhecida,
 * traduz para PT-BR. Retorna `null` quando não há mensagem utilizável.
 *
 * O código estável vem primeiro: casar por texto quebra em silêncio no dia em que alguém
 * reescrever a mensagem no backend, e nenhum teste denuncia.
 */
export function extractApiErrorMessage(error: unknown): string | null {
  const byCode = KNOWN_ERROR_CODES_PT_BR[readErrorCode(error) ?? ''];
  if (byCode) return byCode;

  const raw = readApiMessage(error);
  if (raw === null) {
    return null;
  }
  return translateBackendMessage(raw);
}

/**
 * Traduz uma mensagem crua do backend para PT-BR quando conhecida; senão devolve a original.
 * Use para mensagens que NÃO vêm de um HttpErrorResponse (ex.: itens de erro de uma resposta
 * de sucesso parcial, como {@code BatchAssignmentError.message}).
 */
export function translateBackendMessage(raw: string): string {
  const exact = KNOWN_BACKEND_MESSAGES_PT_BR[raw];
  if (exact) return exact;
  for (const [prefix, translated] of KNOWN_BACKEND_MESSAGE_PREFIXES_PT_BR) {
    if (raw.startsWith(prefix)) return translated;
  }
  return raw;
}

function readApiMessage(error: unknown): string | null {
  const body =
    error instanceof HttpErrorResponse
      ? error.error
      : (error as { error?: unknown } | null | undefined)?.error;

  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message.trim();
    }
  }
  return null;
}
