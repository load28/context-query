import { Provider } from "jotai";
import { useAtomValue } from "jotai";
import {
  employeesAtom,
  departmentsAtom,
  currentViewAtom,
} from "@/store/hrStore";
import { HydrateAtoms } from "@/store/HydrateAtoms";
import { seedEmployees, seedDepartments } from "@/data/seed";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { EmployeeList } from "@/components/EmployeeList";
import { EmployeeForm } from "@/components/EmployeeForm";
import { EmployeeDetail } from "@/components/EmployeeDetail";
import { DepartmentList } from "@/components/DepartmentList";

function MainContent() {
  const currentView = useAtomValue(currentViewAtom);

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
    <Provider>
      <HydrateAtoms
        initialValues={[
          [employeesAtom, seedEmployees],
          [departmentsAtom, seedDepartments],
        ]}
      >
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <MainContent />
          <EmployeeForm />
        </div>
      </HydrateAtoms>
    </Provider>
  );
}
