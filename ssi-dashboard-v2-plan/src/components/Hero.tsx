import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type HeroProps = {
  onUnlock: () => void;
};

export function Hero({ onUnlock }: HeroProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password === (import.meta.env.VITE_WRITE_PASSWORD || "123")) {
      setError(null);
      onUnlock();
      return;
    }

    setError("Sai mật khẩu");
    setPassword("");
  };

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center bg-canvas px-4 text-ink">
      <section className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-medium leading-[1.1] tracking-[-1.08px] text-ink md:text-6xl md:tracking-[-1.92px]">
          SSI Báo Cáo
        </h1>
        <p className="mt-4 text-base leading-[1.55] text-ink-mute md:text-lg">
          Live dashboard · Báo cáo theo ngày, tuần, tháng
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 w-full max-w-md rounded-xl border border-hairline bg-canvas-soft p-8 text-left shadow-panel"
        >
          <label htmlFor="write-password" className="mb-2 block text-sm text-ink-mute">
            Mật khẩu
          </label>
          <Input
            ref={inputRef}
            id="write-password"
            type="password"
            maxLength={32}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={Boolean(error)}
            className="h-10 rounded-md border-hairline bg-canvas text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          />
          <p className="mt-2 min-h-5 text-sm text-status-down">{error ?? ""}</p>
          <Button
            type="submit"
            className="mt-4 h-10 w-full rounded-md border-primary bg-primary px-4 text-sm font-medium text-on-primary transition hover:border-primary-deep hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Vào hệ thống
          </Button>
        </form>
      </section>
    </main>
  );
}
