import type { Metadata, Viewport } from 'next';
import { StudentShell } from '@/features/student-portal/components/StudentShell/StudentShell';

export const metadata: Metadata = {
  title: 'Portal do Aluno — Orbita',
  description: 'Notas, presenças e disciplinas do aluno',
};

// Ocupa o ecrã todo no telemóvel (áreas seguras do iPhone) e pinta a barra do browser
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F4FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0D1A' },
  ],
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
