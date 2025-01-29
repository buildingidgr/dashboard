export interface CustomElement {
  id?: string;
  type: string;
  children: any[];
  isPendingReplacement?: boolean;
} 