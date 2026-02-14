import { HRProvider, useContextAtomValue } from "@/store/hrStore";
import { seedEmployees, seedDepartments } from "@/data/seed";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { EmployeeList } from "@/components/EmployeeList";
import { EmployeeForm } from "@/components/EmployeeForm";
import { EmployeeDetail } from "@/components/EmployeeDetail";
import { DepartmentList } from "@/components/DepartmentList";

function MainContent() {
  const currentView = useContextAtomValue("currentView");

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {currentView === "dashboard" && <Dashboard />}
      {currentView === "employees" && <EmployeeList />}
      {currentView === "employeeDetail" && <EmployeeDetail />}
      {currentView === "departments" && <DepartmentList />}
    </div>
  );
}

export default function App() {
  return (
    <HRProvider
      atoms={{
        employees: seedEmployees,
        departments: seedDepartments,
        searchQuery: "",
        selectedDepartmentId: "all",
        selectedStatusFilter: "all",
        selectedEmployeeId: null,
        currentView: "dashboard",
        formMode: "closed",
        editingEmployee: null,
      }}
    >
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <MainContent />
        <EmployeeForm />
      </div>
    </HRProvider>
  );
}
