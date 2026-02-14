import { atom, derived, shallowEqual } from "@context-query/core";
import { createContextQuery } from "@context-query/react";
import type {
  Employee,
  Department,
  ViewType,
  EmployeeFormMode,
} from "./types";

const hrDefinitions = {
  // ── Writable atoms ──
  employees: atom([] as Employee[], { equalityFn: shallowEqual }),
  departments: atom([] as Department[], { equalityFn: shallowEqual }),
  searchQuery: atom(""),
  selectedDepartmentId: atom("all"),
  selectedStatusFilter: atom("all" as "all" | Employee["status"]),
  selectedEmployeeId: atom(null as string | null),
  currentView: atom("dashboard" as ViewType),
  formMode: atom("closed" as EmployeeFormMode),
  editingEmployee: atom(null as Employee | null),

  // ── Derived atoms ──
  filteredEmployees: derived((get) => {
    const employees = get("employees");
    const query = get("searchQuery").toLowerCase();
    const deptFilter = get("selectedDepartmentId");
    const statusFilter = get("selectedStatusFilter");

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
  }),

  selectedEmployee: derived((get) => {
    const id = get("selectedEmployeeId");
    if (!id) return null;
    return get("employees").find((e) => e.id === id) ?? null;
  }),

  departmentStats: derived((get) => {
    const employees = get("employees");
    const departments = get("departments");

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
        avgSalary: deptEmployees.length > 0
          ? Math.round(totalSalary / deptEmployees.length)
          : 0,
      };
    });
  }),

  totalStats: derived((get) => {
    const employees = get("employees");
    const departments = get("departments");

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
  }),
};

export const {
  ContextQueryProvider: HRProvider,
  useContextAtom,
  useContextAtomValue,
  useContextSetAtom,
  useStore,
} = createContextQuery(hrDefinitions);
