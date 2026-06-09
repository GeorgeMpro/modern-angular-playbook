export interface TableAction<T>{
  label:string;
  callback: (item: T) => void;
}
