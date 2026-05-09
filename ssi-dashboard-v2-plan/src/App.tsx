import { BgPattern } from "./components/BgPattern";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base">
      <BgPattern />
      <main className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold text-text-primary">SSI v2 scaffold ready</h1>
      </main>
    </div>
  );
}
