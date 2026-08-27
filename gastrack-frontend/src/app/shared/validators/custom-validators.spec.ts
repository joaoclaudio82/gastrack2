import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { strictEmail } from './custom-validators';

describe('strictEmail', () => {
  const validate = (value: string) => strictEmail()(new FormControl(value));

  it('should_ReturnNull_When_ValueIsEmpty', () => {
    expect(validate('')).toBeNull();
  });

  it('should_ReturnNull_When_ValueIsWhitespaceOnly', () => {
    expect(validate('   ')).toBeNull();
  });

  it('should_ReturnNull_When_ValueIsValidEmail', () => {
    expect(validate('user@domain.com')).toBeNull();
  });

  it('should_ReturnStrictEmailError_When_DomainHasNoTld', () => {
    expect(validate('user@domain')).toEqual({ strictEmail: true });
  });
});
