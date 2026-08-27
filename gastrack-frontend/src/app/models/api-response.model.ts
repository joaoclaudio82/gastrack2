export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
}

/**
 * Type-safe select option for dropdowns
 */
export interface SelectOption<T = number> {
  readonly label: string;
  readonly value: T;
  readonly disabled?: boolean;
}

export interface ApiError {
  field?: string;
  code: string;
  message: string;
}

/**
 * Frontend pagination response format
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Spring Boot Page<T> response format
 * Maps directly to org.springframework.data.domain.Page
 */
export interface SpringBootPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-indexed page number
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}

/**
 * Pagination request params for Spring Boot endpoints
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Converts Spring Boot Page<T> response to frontend PaginatedResponse<T>
 * Handles the 0-indexed page number from Spring Boot
 */
export function fromSpringBootPage<T>(response: SpringBootPageResponse<T>): PaginatedResponse<T> {
  return {
    items: response.content,
    total: response.totalElements,
    page: response.number + 1, // Convert from 0-indexed to 1-indexed
    pageSize: response.size,
    totalPages: response.totalPages,
  };
}

/**
 * Converts frontend pagination params to Spring Boot query params
 * Handles the 1-indexed to 0-indexed page conversion
 */
export function toSpringBootParams(params: PaginationParams): Record<string, string> {
  const result: Record<string, string> = {};

  if (params.page !== undefined) {
    result['page'] = String(params.page - 1); // Convert to 0-indexed
  }
  if (params.pageSize !== undefined) {
    result['size'] = String(params.pageSize);
  }
  if (params.sortBy) {
    result['sort'] = params.sortOrder === 'desc' ? `${params.sortBy},desc` : `${params.sortBy},asc`;
  }

  return result;
}
