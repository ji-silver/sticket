export interface Diary {
  id: number;
  title: string;
  recordCount: number;
  coverColor: string;
  photoUri?: string;
}

export interface Bucket {
  id: number;
  title: string;
  isCompleted: boolean;
}
