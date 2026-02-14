export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  position: string;
  hireDate: string;
  salary: number;
  status: "active" | "onLeave" | "retired";
  avatarUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  managerId: string | null;
}

export type ViewType =
  | "dashboard"
  | "employees"
  | "departments"
  | "employeeDetail";

export type EmployeeFormMode = "closed" | "add" | "edit";
