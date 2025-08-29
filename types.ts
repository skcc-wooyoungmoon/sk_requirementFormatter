export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface RequirementItem {
  group: string;
  id: string;
  sequence: number;
  description: string;
}

export interface FormattedResult {
  markdownOutput: string;
  requirementsList: RequirementItem[];
}