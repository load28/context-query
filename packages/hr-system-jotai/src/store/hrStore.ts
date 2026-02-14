import { atom } from "jotai";
import type {
  Employee,
  Department,
  ViewType,
  EmployeeFormMode,
} from "./types";

// ── Writable atoms ──
export const employeesAtom = atom<Employee[]>([]);
export const departmentsAtom = atom<Department[]>([]);
export const searchQueryAtom = atom("");
export const selectedDepartmentIdAtom = atom("all");
export const selectedStatusFilterAtom = atom<"all" | Employee["status"]>("all");
export const selectedEmployeeIdAtom = atom<string | null>(null);
export const currentViewAtom = atom<ViewType>("dashboard");
export const formModeAtom = atom<EmployeeFormMode>("closed");
export const editingEmployeeAtom = atom<Employee | null>(null);

// ── Derived (read-only) atoms ──
export const filteredEmployeesAtom = atom((get) => {
  const employees = get(employeesAtom);
  const query = get(searchQueryAtom).toLowerCase();
  const deptFilter = get(selectedDepartmentIdAtom);
  const statusFilter = get(selectedStatusFilterAtom);

  return employees.filter((emp) => {
    const matchesSearch =
      !query ||
      emp.name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.position.toLowerCase().includes(query) ||
      emp.phone.includes(query);

    const matchesDept =
      deptFilter === "all" || emp.departmentId === deptFilter;

    const matchesStatus =
      statusFilter === "all" || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });
});

export const selectedEmployeeAtom = atom((get) => {
  const id = get(selectedEmployeeIdAtom);
  if (!id) return null;
  return get(employeesAtom).find((e) => e.id === id) ?? null;
});

export const departmentStatsAtom = atom((get) => {
  const employees = get(employeesAtom);
  const departments = get(departmentsAtom);

  return departments.map((dept) => {
    const deptEmployees = employees.filter(
      (e) => e.departmentId === dept.id
    );
    const activeCount = deptEmployees.filter(
      (e) => e.status === "active"
    ).length;
    const totalSalary = deptEmployees.reduce(
      (sum, e) => sum + e.salary,
      0
    );

    return {
      ...dept,
      employeeCount: deptEmployees.length,
      activeCount,
      avgSalary:
        deptEmployees.length > 0
          ? Math.round(totalSalary / deptEmployees.length)
          : 0,
    };
  });
});

export const totalStatsAtom = atom((get) => {
  const employees = get(employeesAtom);
  const departments = get(departmentsAtom);

  const activeCount = employees.filter((e) => e.status === "active").length;
  const onLeaveCount = employees.filter(
    (e) => e.status === "onLeave"
  ).length;
  const retiredCount = employees.filter(
    (e) => e.status === "retired"
  ).length;
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalary =
    employees.length > 0 ? Math.round(totalSalary / employees.length) : 0;

  return {
    totalEmployees: employees.length,
    activeCount,
    onLeaveCount,
    retiredCount,
    totalDepartments: departments.length,
    totalSalary,
    avgSalary,
  };
});
