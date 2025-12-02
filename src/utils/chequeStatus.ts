// Frontend statuses (for display)
export type FrontendChequeStatus =
  | 'KASADA'
  | 'BANKADA_TAHSILDE'
  | 'ODEMEDE'
  | 'TAHSIL_OLDU'
  | 'ODEME_YAPILDI'
  | 'KARSILIKSIZ'
  | 'IPTAL'
  | 'CIKMIS';

// Backend statuses (from Prisma)
export type BackendChequeStatus =
  | 'KASADA'
  | 'BANKADA_TAHSILDE'
  | 'ODEMEDE'
  | 'TAHSIL_EDILDI'
  | 'KARSILIKSIZ';

/**
 * Map frontend status to backend status
 */
export function mapToBackendStatus(frontendStatus: FrontendChequeStatus): BackendChequeStatus {
  switch (frontendStatus) {
    case 'TAHSIL_OLDU':
    case 'ODEME_YAPILDI':
      return 'TAHSIL_EDILDI';
    case 'IPTAL':
    case 'CIKMIS':
      // These don't exist in backend - treat as deleted or use KARSILIKSIZ
      return 'KARSILIKSIZ';
    default:
      return frontendStatus as BackendChequeStatus;
  }
}

/**
 * Map backend status to frontend status
 */
export function mapToFrontendStatus(backendStatus: BackendChequeStatus, direction: 'ALACAK' | 'BORC'): FrontendChequeStatus {
  if (backendStatus === 'TAHSIL_EDILDI') {
    return direction === 'ALACAK' ? 'TAHSIL_OLDU' : 'ODEME_YAPILDI';
  }
  return backendStatus as FrontendChequeStatus;
}

