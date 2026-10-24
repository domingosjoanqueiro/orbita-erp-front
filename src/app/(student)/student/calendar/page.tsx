'use client';

import React from 'react';
import { CalendarView } from '@/features/calendar/CalendarView';
import styles from '@/features/student-portal/styles/portal.module.css';

export default function StudentCalendarPage() {
    return (
        <div className={styles.page}>
            <section className={styles.card}>
                <CalendarView source="student" />
            </section>
        </div>
    );
}
