// Tipos de documento aceites pela API (enum DocumentType do backend)
export const DOCUMENT_TYPES = ['BI', 'BIRTH_CERTIFICATE', 'PERSONAL_CARD', 'PASSPORT', 'DIRE'] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  BI: 'Bilhete de Identidade',
  BIRTH_CERTIFICATE: 'Certidão de Nascimento',
  PERSONAL_CARD: 'Cédula Pessoal',
  PASSPORT: 'Passaporte',
  DIRE: 'DIRE',
};

export const DOCUMENT_TYPE_OPTIONS = [
  { value: '', label: 'Selecione...' },
  ...DOCUMENT_TYPES.map(value => ({ value, label: DOCUMENT_TYPE_LABELS[value] })),
];

export function documentTypeLabel(value?: string | null): string {
  if (!value) return 'N/A';
  return DOCUMENT_TYPE_LABELS[value as DocumentType] ?? value;
}
