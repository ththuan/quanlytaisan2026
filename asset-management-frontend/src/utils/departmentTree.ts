export interface DeptTreeNode {
  value: number;
  label: string;
  children?: DeptTreeNode[];
}

export type FlatDept = {
  id: number;
  name: string;
  parent_department_id?: number | null;
};

/**
 * Xây cây phòng ban từ danh sách phẳng (parent_department_id), sắp xếp nhánh theo tên (vi).
 */
export function flatDepartmentsToTree(departments: FlatDept[]): DeptTreeNode[] {
  if (!departments.length) return [];

  const idSet = new Set(departments.map((d) => d.id));
  const nodeMap = new Map<number, DeptTreeNode & { children: DeptTreeNode[] }>();

  for (const d of departments) {
    nodeMap.set(d.id, { value: d.id, label: d.name, children: [] });
  }

  const roots: (DeptTreeNode & { children: DeptTreeNode[] })[] = [];

  for (const d of departments) {
    const node = nodeMap.get(d.id)!;
    const pid = d.parent_department_id;
    if (pid != null && idSet.has(pid)) {
      nodeMap.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRecursive = (nodes: (DeptTreeNode & { children: DeptTreeNode[] })[]): DeptTreeNode[] => {
    const sorted = [...nodes].sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    return sorted.map((n) => {
      if (n.children.length === 0) {
        return { value: n.value, label: n.label };
      }
      return {
        value: n.value,
        label: n.label,
        children: sortRecursive(n.children as (DeptTreeNode & { children: DeptTreeNode[] })[]),
      };
    });
  };

  return sortRecursive(roots);
}
