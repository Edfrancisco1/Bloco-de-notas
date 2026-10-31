export type DomainErrorCode = 'not_found' | 'invalid_reference' | 'invalid_state' | 'conflict';

/** Erro esperado de regra de negócio. A mensagem pode ser mostrada ao utilizador. */
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
