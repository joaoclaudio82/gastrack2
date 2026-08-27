import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

/**
 * Service for Brazilian postal code (CEP) lookup via ViaCEP API
 */
@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly http = inject(HttpClient);
  private readonly VIA_CEP_URL = 'https://viacep.com.br/ws';

  /**
   * Normalized CEP result for address form
   */
  fetch(cep: string): Observable<CepResult | null> {
    const digitsOnly = cep.replace(/\D/g, '');
    if (digitsOnly.length !== 8) {
      return of(null);
    }

    return this.http.get<ViaCepResponse>(`${this.VIA_CEP_URL}/${digitsOnly}/json/`).pipe(
      map((res) => {
        if (res.erro) return null;
        return {
          zipCode: res.cep ?? digitsOnly,
          street: res.logradouro ?? '',
          neighborhood: res.bairro ?? '',
          complement: res.complemento ?? '',
          cityName: res.localidade ?? '',
          stateAbbreviation: res.uf ?? '',
        };
      }),
      catchError(() => of(null)),
    );
  }
}

/**
 * Response from ViaCEP API
 * @see https://viacep.com.br/
 */
export interface ViaCepResponse {
  erro?: boolean;
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

/**
 * Normalized CEP result for address form
 */
export interface CepResult {
  zipCode: string;
  street: string;
  neighborhood: string;
  complement: string;
  cityName: string;
  stateAbbreviation: string;
}
