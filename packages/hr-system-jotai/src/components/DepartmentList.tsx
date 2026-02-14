import { useState } from "react";
import { Plus, Pencil, Trash2, X, Users } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import {
  departmentsAtom,
  departmentStatsAtom,
  employeesAtom,
} from "@/store/hrStore";
import type { Department } from "@/store/types";

export function DepartmentList() {
  const [departments, setDepartments] = useAtom(departmentsAtom);
  const departmentStats = useAtomValue(departmentStatsAtom);
  const employees = useAtomValue(employeesAtom);

  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const handleAdd = () => {
    if (!form.name) return;
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: form.name,
      description: form.description,
      managerId: null,
    };
    setDepartments([...departments, newDept]);
    setForm({ name: "", description: "" });
    setIsAdding(false);
  };

  const handleEdit = () => {
    if (!editingDept || !form.name) return;
    setDepartments(
      departments.map((d) =>
        d.id === editingDept.id
          ? { ...d, name: form.name, description: form.description }
          : d
      )
    );
    setEditingDept(null);
    setForm({ name: "", description: "" });
  };

  const handleDelete = (id: string) => {
    const hasEmployees = employees.some((e) => e.departmentId === id);
    if (hasEmployees) {
      alert("해당 부서에 소속된 직원이 있어 삭제할 수 없습니다.");
      return;
    }
    if (window.confirm("정말 이 부서를 삭제하시겠습니까?")) {
      setDepartments(departments.filter((d) => d.id !== id));
    }
  };

  const startEdit = (dept: Department) => {
    setEditingDept(dept);
    setForm({ name: dept.name, description: dept.description });
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingDept(null);
    setForm({ name: "", description: "" });
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingDept(null);
    setForm({ name: "", description: "" });
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "미지정";
    return employees.find((e) => e.id === managerId)?.name ?? "미지정";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">부서 관리</h2>
          <p className="text-muted-foreground mt-1">
            전체 {departments.length}개 부서
          </p>
        </div>
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          부서 추가
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingDept) && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground">
              {editingDept ? "부서 수정" : "새 부서 추가"}
            </h3>
            <button
              onClick={cancelForm}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="부서명"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              placeholder="설명"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="flex-2 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={editingDept ? handleEdit : handleAdd}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {editingDept ? "수정" : "추가"}
            </button>
          </div>
        </div>
      )}

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departmentStats.map((dept) => (
          <div
            key={dept.id}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-card-foreground text-lg">
                  {dept.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {dept.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    startEdit(departments.find((d) => d.id === dept.id)!)
                  }
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                  title="수정"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                  title="삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users size={14} />
                <span>
                  직원 <span className="font-medium text-card-foreground">{dept.employeeCount}명</span>
                </span>
              </div>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">
                팀장: <span className="font-medium text-card-foreground">{getManagerName(dept.managerId)}</span>
              </span>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">
                평균연봉: <span className="font-medium text-card-foreground">{dept.avgSalary}만원</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
