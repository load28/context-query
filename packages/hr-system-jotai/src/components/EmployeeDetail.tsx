import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Pencil,
} from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  selectedEmployeeAtom,
  departmentsAtom,
  currentViewAtom,
  formModeAtom,
  editingEmployeeAtom,
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

export function EmployeeDetail() {
  const employee = useAtomValue(selectedEmployeeAtom);
  const departments = useAtomValue(departmentsAtom);
  const setCurrentView = useSetAtom(currentViewAtom);
  const setFormMode = useSetAtom(formModeAtom);
  const setEditingEmployee = useSetAtom(editingEmployeeAtom);

  if (!employee) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        직원을 찾을 수 없습니다.
      </div>
    );
  }

  const department = departments.find(
    (d) => d.id === employee.departmentId
  );

  const handleEdit = () => {
    setEditingEmployee(employee);
    setFormMode("edit");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView("employees")}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">직원 상세</h2>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
              {employee.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground">
                {employee.name}
              </h3>
              <p className="text-muted-foreground">
                {department?.name} · {employee.position}
              </p>
              <span
                className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[employee.status]}`}
              >
                {statusLabels[employee.status]}
              </span>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Pencil size={14} />
            수정
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem icon={Mail} label="이메일" value={employee.email} />
          <InfoItem icon={Phone} label="전화번호" value={employee.phone} />
          <InfoItem
            icon={Building2}
            label="부서"
            value={department?.name ?? "미지정"}
          />
          <InfoItem icon={Calendar} label="입사일" value={employee.hireDate} />
          <InfoItem
            icon={DollarSign}
            label="연봉"
            value={`${employee.salary.toLocaleString()}만원`}
          />
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted">
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-card-foreground">{value}</p>
      </div>
    </div>
  );
}
