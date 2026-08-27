import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { extractApiErrorMessage, translateBackendMessage } from './api-error';

describe('extractApiErrorMessage', () => {
  it('should_ReturnNull_When_ErrorHasNoBodyMessage', () => {
    expect(extractApiErrorMessage(new HttpErrorResponse({ status: 500 }))).toBeNull();
  });

  it('should_ReturnNull_When_ErrorIsNotAnObject', () => {
    expect(extractApiErrorMessage('boom')).toBeNull();
    expect(extractApiErrorMessage(null)).toBeNull();
    expect(extractApiErrorMessage(undefined)).toBeNull();
  });

  it('should_ReturnRawMessage_When_MessageIsUnknown', () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: 'Some backend error' } });
    expect(extractApiErrorMessage(error)).toBe('Some backend error');
  });

  it('should_TranslateMessage_When_MessageIsKnown', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Address is not enabled for this contract' },
    });
    expect(extractApiErrorMessage(error)).toBe(
      'O endereço selecionado não está habilitado para este contrato.',
    );
  });

  it('should_TranslateCompanySlugMessage_When_MessageIsKnown', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Company with this slug already exists' },
    });
    expect(extractApiErrorMessage(error)).toBe('Já existe uma empresa com este slug.');
  });

  it('should_ReadPlainErrorShape_When_NotHttpErrorResponse', () => {
    expect(extractApiErrorMessage({ error: { message: 'Plain shape' } })).toBe('Plain shape');
  });

  it('should_ReturnNull_When_MessageIsBlank', () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: '   ' } });
    expect(extractApiErrorMessage(error)).toBeNull();
  });
});

describe('translateBackendMessage', () => {
  it('should_TranslateKnownMessage_When_InMap', () => {
    expect(
      translateBackendMessage(
        'Kit already has an active ESP32; a kit supports exactly one ESP32 (kit = 1 ESP)',
      ),
    ).toContain('já tem um ESP32');
  });

  it('should_PassThrough_When_MessageUnknown', () => {
    expect(translateBackendMessage('Some unmapped message')).toBe('Some unmapped message');
  });

  it('should_TranslateCrossCompanyMove_When_InMap', () => {
    expect(
      translateBackendMessage('cross-company move nao permitido; use remover + reinstalar'),
    ).toContain('migrar um kit entre empresas');
  });

  it('should_TranslateSensorNotFound_When_InMap', () => {
    expect(translateBackendMessage('Sensor not found in kit or not active')).toBe(
      'Sensor não encontrado no kit ou inativo.',
    );
  });

  it('should_TranslateByPrefix_When_MessageCarriesDynamicCount', () => {
    // O "(1)" é dinâmico — casa por prefixo.
    expect(translateBackendMessage('Contract has reached its maximum number of kits (1)')).toBe(
      'Este contrato já atingiu o limite de kits permitido.',
    );
    expect(translateBackendMessage('Contract has reached its maximum number of kits (5)')).toBe(
      'Este contrato já atingiu o limite de kits permitido.',
    );
  });

  it('should_PreferErrorCode_When_BackendSendsAStableOne', () => {
    // O código sobrevive à reescrita da mensagem; o texto, não.
    const error = new HttpErrorResponse({
      status: 409,
      error: { message: 'qualquer texto novo em ingles', errorCode: 'CYLINDER_SERIAL_DUPLICATE' },
    });

    expect(extractApiErrorMessage(error)).toBe('Já existe um cilindro com este número de série.');
  });

  it('should_FallBackToText_When_ErrorCodeIsNotOneWeKnow', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { message: 'Cylinder with this Serial number already exists', errorCode: 'CONFLICT' },
    });

    expect(extractApiErrorMessage(error)).toBe('Já existe um cilindro com este número de série.');
  });

  it('should_TranslateGasMismatch_When_MessageCarriesTheGases', () => {
    expect(
      translateBackendMessage('Gas point already has cylinders of gas type O2; cannot mix with N2'),
    ).toBe('Esta linha já opera com outro gás. Não é possível misturar gases no mesmo manifold.');
  });

  /** Colisão de constraint que escapa do pré-check: dois operadores salvando o mesmo serial. */
  it('should_TranslateGenericConflict_When_ConstraintEscapesThePreCheck', () => {
    expect(translateBackendMessage('The resource conflicts with an existing record.')).toContain(
      'conflita com outro já existente',
    );
  });
});
