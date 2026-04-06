import { SearchPage } from "@/components/search-page";

export default function Home() {
  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">IMAGO Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search across 10,000+ media items
        </p>
      </header>
      <SearchPage />
    </main>
  );
}
