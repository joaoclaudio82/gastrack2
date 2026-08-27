import { withAllowedAddress } from './contract.model';

describe('withAllowedAddress', () => {
  it('should_AppendAddress_When_NotPresent', () => {
    expect(withAllowedAddress([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it('should_NotDuplicate_When_AlreadyPresent', () => {
    expect(withAllowedAddress([1, 2, 3], 2)).toEqual([1, 2, 3]);
  });

  it('should_ReturnSingleAddress_When_ListEmpty', () => {
    expect(withAllowedAddress([], 5)).toEqual([5]);
  });
});
