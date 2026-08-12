'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, User } from 'lucide-react';
import { Table } from '@/shared/components/ui/Table/Table';
import { Button } from '@/shared/components/ui/Button/Button';
import { Input } from '@/shared/components/ui/Input/Input';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { StudentForm } from '@/features/academic/students/components/StudentForm';
import styles from './page.module.css';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Dados mockados para exemplo
  const mockStudents = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      document: '123.456.789-00',
      status: 'active',
      enrollments: 2,
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      document: '987.654.321-00',
      status: 'active',
      enrollments: 1,
    },
    {
      id: '3',
      name: 'Pedro Oliveira',
      email: 'pedro.oliveira@email.com',
      document: '456.789.123-00',
      status: 'inactive',
      enrollments: 0,
    },
  ];

  const columns = [
    { 
      key: 'name', 
      header: 'Nome',
      render: (item: any) => (
        <div className={styles.nameCell}>
          <div className={styles.avatar}>
            <User size={16} />
          </div>
          <div>
            <div className={styles.name}>{item.name}</div>
            <div className={styles.email}>{item.email}</div>
          </div>
        </div>
      )
    },
    { key: 'document', header: 'Documento' },
    { 
      key: 'status', 
      header: 'Status',
      render: (item: any) => (
        <Badge variant={item.status === 'active' ? 'success' : 'error'}>
          {item.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    { key: 'enrollments', header: 'Matrículas' },
    {
      key: 'actions',
      header: 'Ações',
      render: (item: any) => (
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={() => handleEdit(item)}
          >
            <Edit2 size={16} />
          </button>
          <button
            className={styles.actionButton}
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleEdit = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
      console.log('Deletar aluno:', id);
    }
  };

  const handleCreate = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Alunos</h1>
          <p className={styles.subtitle}>
            Gerencie todos os alunos do sistema
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={handleCreate}>
          Novo Aluno
        </Button>
      </div>

      <div className={styles.toolbar}>
        <Input
          placeholder="Pesquisar alunos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={18} />}
          fullWidth
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          {/* Filtros adicionais */}
        </div>
      </div>

      <div className={styles.tableContainer}>
        <Table
          columns={columns}
          data={mockStudents}
          emptyMessage="Nenhum aluno encontrado"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? 'Editar Aluno' : 'Novo Aluno'}
        size="lg"
      >
        <StudentForm
          student={selectedStudent}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedStudent(null);
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedStudent(null);
          }}
        />
      </Modal>
    </div>
  );
}