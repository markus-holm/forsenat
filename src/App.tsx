import { useEffect } from "react";
import TrainInfo from "./components/TrainInfo";
import { TrainService } from "./services/TrainService";

function App() {
  useEffect(() => {
    TrainService.initialize().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md mb-8">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Train Delay Checker
          </h1>
        </div>
      </header>
      <main>
        <TrainInfo />
      </main>
    </div>
  );
}

export default App;
