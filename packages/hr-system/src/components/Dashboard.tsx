import {
  Users,
  UserCheck,
  UserX,
  Building2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useContextAtomValue } from "@/store/hrStore";

export function Dashboard() {
  const stats = useContextAtomValue("totalStats");
  const departmentStats = useContextAtomValue("departmentStats");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">대시보드</h2>
        <p className="text-muted-foreground mt-1">
          인사 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="전체 직원"
          value={stats.totalEmployees}
          suffix="명"
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={UserCheck}
          label="재직 중"
          value={stats.activeCount}
          suffix="명"
          color="text-success"
          bgColor="bg-success/10"
        />
        <StatCard
          icon={UserX}
          label="휴직 중"
          value={stats.onLeaveCount}
          suffix="명"
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <StatCard
          icon={Building2}
          label="부서 수"
          value={stats.totalDepartments}
          suffix="개"
          color="text-accent-foreground"
          bgColor="bg-accent"
        />
        <StatCard
          icon={DollarSign}
          label="평균 연봉"
          value={stats.avgSalary}
          suffix="만원"
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={TrendingUp}
          label="총 인건비"
          value={stats.totalSalary.toLocaleString()}
          suffix="만원"
          color="text-success"
          bgColor="bg-success/10"
        />
      </div>

      {/* Department Overview */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          부서별 현황
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentStats.map((dept) => (
            <div
              key={dept.id}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-card-foreground">
                  {dept.name}
                </h4>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {dept.employeeCount}명
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {dept.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  재직: <span className="text-success font-medium">{dept.activeCount}명</span>
                </span>
                <span className="text-muted-foreground">
                  평균연봉: <span className="text-foreground font-medium">{dept.avgSalary}만원</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  bgColor,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  suffix: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bgColor}`}>
          <Icon size={20} className={color} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-card-foreground">
            {value}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {suffix}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
