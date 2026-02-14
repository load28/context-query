import { Search, Filter, Eye, Pencil, Trash2 } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  searchQueryAtom,
  selectedDepartmentIdAtom,
  selectedStatusFilterAtom,
  filteredEmployeesAtom,
  departmentsAtom,
  currentViewAtom,
  selectedEmployeeIdAtom,
  formModeAtom,
  editingEmployeeAtom,
  employeesAtom,
} from "@/store/hrStore";
import type { Employee } from "@/store/types";

const statusLabels: Record<Employee["status"], string> = {
  active: "재직",
  onLeave: "휴직",
  retired: "퇴직",
};

const statusColors: Record<Employee["status"], string> = {
  active: "bg-success/10 text-success",
  onLeave: "bg-warning/10 text-warning",
  retired: "bg-muted text-muted-foreground",
};

export function EmployeeList() {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [selectedDeptId, setSelectedDeptId] = useAtom(
    selectedDepartmentIdAtom
  );
  const [statusFilter, setStatusFilter] = useAtom(selectedStatusFilterAtom);
  const filteredEmployees = useAtomValue(filteredEmployeesAtom);
  const departments = useAtomValue(departmentsAtom);
  const setCurrentView = useSetAtom(currentViewAtom);
  const setSelectedEmployeeId = useSetAtom(selectedEmployeeIdAtom);
  const setFormMode = useSetAtom(formModeAtom);
  const setEditingEmployee = useSetAtom(editingEmployeeAtom);
  const [employees, setEmployees] = useAtom(employeesAtom);

  const handleView = (id: string) => {
    setSelectedEmployeeId(id);
    setCurrentView("employeeDetail");
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormMode("edit");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("정말 이 직원을 삭제하시겠습니까?")) {
      setEmployees(employees.filter((e) => e.id !== id));
    }
  };

  const getDeptName = (deptId: string) =>
    departments.find((d) => d.id === deptId)?.name ?? "미지정";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">직원 관리</h2>
          <p className="text-muted-foreground mt-1">
            전체 {filteredEmployees.length}명
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="이름, 이메일, 직책, 전화번호 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-card text-card-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="relative">
          <Filter
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-lg border border-input bg-card text-card-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">전체 부서</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          className="px-3 py-2.5 rounded-lg border border-input bg-card text-card-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">전체 상태</option>
          <option value="active">재직</option>
          <option value="onLeave">휴직</option>
          <option value="retired">퇴직</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  이름
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  부서
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  직책
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  입사일
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  연봉
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                  상태
                </th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-card-foreground">
                          {emp.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {emp.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-card-foreground">
                      {getDeptName(emp.departmentId)}
                    </td>
                    <td className="px-4 py-3 text-card-foreground">
                      {emp.position}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {emp.hireDate}
                    </td>
                    <td className="px-4 py-3 text-card-foreground font-medium">
                      {emp.salary.toLocaleString()}만원
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[emp.status]}`}
                      >
                        {statusLabels[emp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(emp.id)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                          title="상세보기"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEdit(emp)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                          title="수정"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                          title="삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
