export interface ProgramPeriod {
  academicPeriod:
    | 'FIRST'
    | 'SECOND'
    | 'THIRD'
    | 'FOURTH';

  displayName: string;
}


export interface ProgramAcademicSetting {

  id: number;

  uuid: string;

  companyId: number;

  programUuid: string;

  program?: {
    id: number;
    uuid: string;
    name: string;
    code: string;
  };

  programName: string;

  programCode: string;

  periodCount: number;

  assessmentWorkflow:
    | 'DIRECT'
    | 'SUBMISSION'
    | 'VALIDATION';

  publishMode:
    | 'MANUAL'
    | 'AUTOMATIC';

  allowStudentViewBeforePublication: boolean;

  allowTeacherEditAfterSubmission: boolean;

  isActive: boolean;

  periods: ProgramPeriod[];

  createdAt: string;

  updatedAt: string;

  deletedAt?: string;
}


export interface CreateProgramSettingRequest {

  programUuid: string;

  periodCount: number;

  assessmentWorkflow:
    | 'DIRECT'
    | 'SUBMISSION'
    | 'VALIDATION';

  publishMode:
    | 'MANUAL'
    | 'AUTOMATIC';

  allowStudentViewBeforePublication: boolean;

  allowTeacherEditAfterSubmission: boolean;

  periods: ProgramPeriod[];
}


export interface UpdateProgramSettingRequest {

  periodCount?: number;

  assessmentWorkflow?:
    | 'DIRECT'
    | 'SUBMISSION'
    | 'VALIDATION';

  publishMode?:
    | 'MANUAL'
    | 'AUTOMATIC';

  allowStudentViewBeforePublication?: boolean;

  allowTeacherEditAfterSubmission?: boolean;

  periods?: ProgramPeriod[];

  isActive?: boolean;
}


export interface ProgramSettingFilters {

  search?: string;

  programUuid?: string;

  isActive?: boolean;

  page?: number;

  limit?: number;

}