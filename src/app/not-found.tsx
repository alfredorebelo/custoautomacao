import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid max-w-xl gap-3">
      <h1 className="text-4xl">Esta página não está na leitura.</h1>
      <p><Link href="/">Voltar à calculadora</Link></p>
    </div>
  );
}
