export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="font-mono text-sm text-muted">404 · route not found</p>
        <h1 className="font-display mt-4 text-7xl font-extrabold uppercase">Off the pitch</h1>
        <a href="./" className="mt-8 inline-block font-mono text-sm text-accent underline">back to the control room</a>
      </div>
    </main>
  );
}
