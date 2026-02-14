import { X } from "lucide-react";
import { useState, useEffect } from "react";
import {
  useContextAtom,
  useContextAtomValue,
  useContextSetAtom,
} from "@/store/hrStore";
import type { Employee } from "@/store/types";

export function EmployeeForm() {
  const [formMode, setFormMode] = useContextAtom("formMode");
  const editingEmployee = useContextAtomValue("editingEmployee");
  const departments = useContextAtomValue("departments");
  const [employees, setEmployees] = useContextAtom("employees");
  const setEditingEmployee = useContextSetAtom("editingEmployee");

  const isOpen = formMode !== "closed";
  const isEdit = formMode === "edit";

  const emptyForm: Omit<Employee, "id"> = {
    name: "",
    email: "",
    phone: "",
    departmentId: departments[0]?.id ?? "",
    position: "",
    hireDate: new Date().toISOString().split("T")[0],
    salary: 0,
    status: "active",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (isEdit && editingEmployee) {
      const { id: _id, ...rest } = editingEmployee;
      void _id;
      setForm(rest);
    } else {
      setForm(emptyForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMode, editingEmployee]);

  if (!isOpen) return null;

  const handleClose = () => {
    setFormMode("closed");
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.departmentId) return;

    if (isEdit && editingEmployee) {
      setEmployees(
        employees.map((emp) =>
          emp.id === editingEmployee.id ? { ...emp, ...form } : emp
        )
      );
    } else {
      const newEmployee: Employee = {
        ...form,
        id: `emp-${Date.now()}`,
      };
      setEmployees([...employees, newEmployee]);
    }

    handleClose();
  };

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-card-foreground">
            {isEdit ? "직원 정보 수정" : "새 직원 추가"}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                이름 *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                이메일 *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="gildong@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                전화번호
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                부서 *
              </label>
              <select
                required
                value={form.departmentId}
                onChange={(e) => updateField("departmentId", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                직책
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => updateField("position", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="시니어 개발자"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                입사일
              </label>
              <input
                type="date"
                value={form.hireDate}
                onChange={(e) => updateField("hireDate", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                연봉 (만원)
              </label>
              <input
                type="number"
                min={0}
                value={form.salary}
                onChange={(e) =>
                  updateField("salary", parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">
                상태
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  updateField("status", e.target.value as Employee["status"])
                }
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="active">재직</option>
                <option value="onLeave">휴직</option>
                <option value="retired">퇴직</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-card-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {isEdit ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
