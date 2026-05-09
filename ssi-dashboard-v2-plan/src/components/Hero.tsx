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

    if (password === import.meta.env.VITE_WRITE_PASSWORD) {
      setError(null);
      onUnlock();
      return;
    }

    setError("Sai mật khẩu");
    setPassword("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold text-text-primary md:text-5xl">SSI Báo Cáo</h1>
        <p className="mt-3 text-sm text-text-muted md:text-base">Live dashboard · Báo cáo theo ngày, tuần, tháng</p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
          <label htmlFor="write-password" className="mb-2 block text-left text-sm text-text-muted">
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
          />
          <p className="mt-2 min-h-5 text-left text-sm text-red-300">{error ?? ""}</p>
          <Button type="submit" className="mt-4 w-full">
            Vào hệ thống
          </Button>
        </form>
      </section>
    </main>
  );
}
