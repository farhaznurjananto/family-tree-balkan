interface ITree {
  id: number;
  name: string;
  description: string;
  file: json;
}

interface NodeData {
  id: number;
  pids?: string | string[] | number | number[];
  gender: "male" | "female";
  name: string;
  photo?: string;
  birthDate?: string;
  deathDate?: string;
  address?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  note?: string;
  mid?: number;
  fid?: number;
}

export type { ITree, NodeData };
