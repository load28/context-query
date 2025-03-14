import "./App.css";
import {
  ContextQueryImplementation,
  cqLogger,
} from "./ContextQueryImplementation";
import {
  ReactContextImplementation,
  rcLogger,
} from "./ReactContextImplementation";
import { LogViewer } from "./lib/LoggerViewer";

function App() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Context API 비교 플레이그라운드
          </h1>
          <p className="text-muted-foreground">
            Context Query vs React Context API 비교
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-lg">
              <div className="size-3 bg-[#4285f4] rounded-full mr-2"></div>
              <span>Context Query</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg">
              <div className="size-3 bg-[#34a853] rounded-full mr-2"></div>
              <span>React Context</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContextQueryImplementation />
          <ReactContextImplementation />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <LogViewer logger={cqLogger} maxLogs={15} />
          <LogViewer logger={rcLogger} maxLogs={15} />
        </div>
      </div>
    </div>
  );
}

export default App;
