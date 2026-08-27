/**
 * Country entity
 */
export interface Country {
  id: number;
  name: string;
  code: string;
}

/**
 * State/Province entity
 */
export interface State {
  id: number;
  name: string;
  code: string;
  abbreviation: string;
  countryId: number;
}

/**
 * City entity
 */
export interface City {
  id: number;
  name: string;
  code?: string;
  stateId: number;
  stateName: string;
  stateAbbreviation: string;
}

/**
 * Search result for city autocomplete
 */
export interface CitySearchResult {
  id: number;
  name: string;
  stateId: number;
  stateName: string;
  stateAbbreviation: string;
  fullName: string;
}
