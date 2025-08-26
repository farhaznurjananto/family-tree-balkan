interface ITree {
  id: number;
  name: string;
  description: string;
  file: json;
}

// Tambahkan interface untuk marriage status
interface MarriageStatus {
  partnerId: string;
  status: "married" | "divorced";
  marriageDate?: string;
  divorceDate?: string;
}

interface ChildStatus {
  parentId: string;
  status: "biological" | "adopted";
}

interface NodeData {
  id: string;
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
  marriageStatuses?: MarriageStatus[];
  childStatuses?: ChildStatus[];
}

export type { ITree, NodeData, MarriageStatus };