import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrength(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const isValidLength = value.length >= 8;

    const passwordValid =
      hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isValidLength;

    return passwordValid ? null : { passwordStrength: true };
  };
}

export function matchField(fieldName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) {
      return null;
    }

    const fieldToMatch = parent.get(fieldName);
    if (!fieldToMatch) {
      return null;
    }

    if (control.value !== fieldToMatch.value) {
      return { matchField: { field: fieldName } };
    }

    return null;
  };
}

export function noWhitespace(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    const isWhitespace = value.trim().length === 0;
    return isWhitespace ? { noWhitespace: true } : null;
  };
}

export function phoneNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(value) ? null : { phoneNumber: true };
  };
}

/**
 * Ensures email contains a domain with at least one dot segment (e.g. user@domain.com).
 */
export function strictEmail(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = ((control.value as string) ?? '').trim();

    if (!value) {
      return null;
    }

    const strictEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return strictEmailRegex.test(value) ? null : { strictEmail: true };
  };
}

/**
 * Validates Brazilian CNPJ format (XX.XXX.XXX/XXXX-XX)
 */
export function cnpj(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    // Remove formatting characters
    const cnpjClean = value.replace(/[^\d]/g, '');

    // Check if has 14 digits
    if (cnpjClean.length !== 14) {
      return { cnpj: true };
    }

    // Check if all digits are the same (invalid)
    if (/^(\d)\1+$/.test(cnpjClean)) {
      return { cnpj: true };
    }

    // Validate CNPJ check digits
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const calculateDigit = (base: string, weights: number[]): number => {
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        const char = base[i];
        const weight = weights[i];
        if (char !== undefined && weight !== undefined) {
          sum += parseInt(char, 10) * weight;
        }
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const digit1 = calculateDigit(cnpjClean.slice(0, 12), weights1);
    const digit2 = calculateDigit(cnpjClean.slice(0, 12) + String(digit1), weights2);

    const char12 = cnpjClean[12];
    const char13 = cnpjClean[13];
    const isValid =
      char12 !== undefined &&
      char13 !== undefined &&
      digit1 === parseInt(char12, 10) &&
      digit2 === parseInt(char13, 10);

    return isValid ? null : { cnpj: true };
  };
}

/**
 * Validator for address FormGroup: valid when all key fields are empty (optional address).
 * When any key field has value, all required fields must be filled and pass format checks.
 */
export function optionalAddressGroup(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control;
    if (group?.get?.('name') == null) return null;

    const name = (group.get('name')?.value ?? '').toString().trim();
    const street = (group.get('street')?.value ?? '').toString().trim();
    const zipCode = (group.get('zipCode')?.value ?? '').toString().trim();
    const cityId = group.get('cityId')?.value;
    const stateId = group.get('stateId')?.value;

    const isAllEmpty = !name && !street && !zipCode && cityId == null && stateId == null;
    if (isAllEmpty) return null;

    if (name.length < 2) return { optionalAddressIncomplete: { field: 'name' } };
    if (!street) return { optionalAddressIncomplete: { field: 'street' } };
    const cepClean = (zipCode ?? '').replace(/\D/g, '');
    if (cepClean.length !== 8) return { optionalAddressIncomplete: { field: 'zipCode' } };
    if (cityId == null) return { optionalAddressIncomplete: { field: 'cityId' } };
    if (stateId == null) return { optionalAddressIncomplete: { field: 'stateId' } };

    return null;
  };
}

/**
 * Validates Brazilian CEP format (XXXXX-XXX)
 */
export function cep(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;

    if (!value) {
      return null;
    }

    const cepClean = value.replace(/[^\d]/g, '');
    return cepClean.length === 8 ? null : { cep: true };
  };
}
