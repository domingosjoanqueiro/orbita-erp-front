// src/features/academic/students/types/student.types.ts

export type Gender =
    | 'MALE'
    | 'FEMALE';

export type DocumentType =
    | 'BI'
    | 'PASSPORT'
    | 'DIRE'
    | 'NUIT';

export type StudentStatus =
    | 'ACTIVE'
    | 'INACTIVE'
    | 'GRADUATED'
    | 'TRANSFERRED'
    | 'SUSPENDED';


/*
|--------------------------------------------------------------------------
| Current Enrollment
|--------------------------------------------------------------------------
*/

export interface StudentCurrentEnrollment {

    uuid: string;

    enrollmentNumber: string;

    enrollmentDate: string;

    status: string;

    grade: {

        uuid: string;

        name: string;

        code: string | null;

    };

    class: {

        uuid: string;

        name: string;

        code: string | null;

    };

}


/*
|--------------------------------------------------------------------------
| Student
|--------------------------------------------------------------------------
*/

export interface Student {

    id: number;

    uuid: string;

    companyId: number;

    userId?: number | null;

    studentNumber: string;

    firstName: string;

    middleName?: string | null;

    lastName: string;

    fullName: string;

    gender: Gender;

    birthDate: string;

    birthPlace?: string | null;

    nationality?: string | null;

    province?: string | null;

    district?: string | null;

    address?: string | null;

    phone?: string | null;

    email?: string | null;

    documentType?: DocumentType | null;

    documentNumber?: string | null;

    fatherFullName?: string | null;

    motherFullName?: string | null;

    guardianName?: string | null;

    guardianPhone?: string | null;

    guardianRelationship?: string | null;

    photo?: string | null;

    admissionDate?: string | null;

    studentStatus?: StudentStatus | null;

    remarks?: string | null;

    isActive: boolean;

    createdAt: string;

    updatedAt: string;

    deletedAt?: string | null;


    /*
    |--------------------------------------------------------------------------
    | Current Academic Allocation
    |--------------------------------------------------------------------------
    */

    currentEnrollment:
        StudentCurrentEnrollment | null;

}


/*
|--------------------------------------------------------------------------
| Create Student
|--------------------------------------------------------------------------
*/

export interface CreateStudentRequest {

    firstName: string;

    middleName?: string | null;

    lastName: string;

    gender: Gender;

    birthDate: string;

    birthPlace?: string | null;

    nationality?: string | null;

    province?: string | null;

    district?: string | null;

    address?: string | null;

    phone?: string | null;

    email?: string | null;

    documentType?: DocumentType | null;

    documentNumber?: string | null;

    fatherFullName?: string | null;

    motherFullName?: string | null;

    guardianName?: string | null;

    guardianPhone?: string | null;

    guardianRelationship?: string | null;

    photo?: string | null;

    admissionDate?: string | null;

    studentStatus?: StudentStatus | null;

    remarks?: string | null;

    isActive?: boolean;

}


/*
|--------------------------------------------------------------------------
| Update Student
|--------------------------------------------------------------------------
*/

export interface UpdateStudentRequest {

    firstName?: string;

    middleName?: string | null;

    lastName?: string;

    gender?: Gender;

    birthDate?: string;

    birthPlace?: string | null;

    nationality?: string | null;

    province?: string | null;

    district?: string | null;

    address?: string | null;

    phone?: string | null;

    email?: string | null;

    documentType?: DocumentType | null;

    documentNumber?: string | null;

    fatherFullName?: string | null;

    motherFullName?: string | null;

    guardianName?: string | null;

    guardianPhone?: string | null;

    guardianRelationship?: string | null;

    photo?: string | null;

    admissionDate?: string | null;

    studentStatus?: StudentStatus | null;

    remarks?: string | null;

    isActive?: boolean;

}


/*
|--------------------------------------------------------------------------
| Student Filters
|--------------------------------------------------------------------------
*/

export interface StudentFilters {

    search?: string;

    gender?: Gender;

    classUuid?: string;

    gradeUuid?: string;

    studentStatus?: StudentStatus;

    isActive?: boolean;

    page?: number;

    limit?: number;

}


/*
|--------------------------------------------------------------------------
| Student With User
|--------------------------------------------------------------------------
*/

export interface StudentWithUser
    extends Student {

    user?: {

        id: number;

        uuid: string;

        email: string;

        username: string;

        isActive: boolean;
        createdAt: string;

    };

}


/*
|--------------------------------------------------------------------------
| Student Credentials
|--------------------------------------------------------------------------
*/

export interface StudentCredentials {

    username: string;

    temporaryPassword: string;

}


export interface StudentResponseWithCredentials
    extends Student {

    credentials?: StudentCredentials;

}


/*
|--------------------------------------------------------------------------
| Grade
|--------------------------------------------------------------------------
*/

export interface Grade {

    uuid: string;

    name: string;

    code: string;

}


/*
|--------------------------------------------------------------------------
| Class
|--------------------------------------------------------------------------
*/

export interface Class {

    uuid: string;

    name: string;

    code: string;

    gradeUuid: string;

    gradeName: string;

}