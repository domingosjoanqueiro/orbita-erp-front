'use client';

import { useEffect, useState } from 'react';
import { academicYearService } from '@/features/academic/academic-years/services/academic-year.service';
import { classService } from '@/features/academic/classes/services/class.service';
import { gradeService } from '@/features/academic/grades/services/grade.service';

export interface Option {
    uuid: string;
    name: string;
}

// Anos letivos, classes e turmas para filtros e formulários do financeiro
export function useFinanceLookups() {
    const [years, setYears] = useState<Option[]>([]);
    const [grades, setGrades] = useState<Option[]>([]);
    const [classes, setClasses] = useState<(Option & { year: string })[]>([]);

    useEffect(() => {
        academicYearService
            .getAll({ limit: 50 })
            .then(result => setYears(result.data.map(year => ({ uuid: year.uuid, name: year.name })).sort((a, b) => b.name.localeCompare(a.name))))
            .catch(() => setYears([]));
        gradeService
            .getAll({ limit: 100 })
            .then(result => setGrades(result.data.map(grade => ({ uuid: grade.uuid, name: grade.name })).sort((a, b) => a.name.localeCompare(b.name, 'pt', { numeric: true }))))
            .catch(() => setGrades([]));
        classService
            .getAll({ limit: 100 })
            .then(result =>
                setClasses(
                    (result.data as unknown as { uuid: string; name: string; gradeName: string; academicYearName: string }[]).map(item => ({
                        uuid: item.uuid,
                        name: `${item.gradeName} · Turma ${item.name}`,
                        year: item.academicYearName,
                    }))
                )
            )
            .catch(() => setClasses([]));
    }, []);

    return { years, grades, classes };
}
