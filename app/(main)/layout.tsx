import Link from "next/link";

const TMDB_LOGO =
  "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg";

// Shared shell for signed-in pages: header navigation and content width.
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <nav className="mx-auto flex w-full max-w-4xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link href="/" className="font-semibold">
            Content Calendar
          </Link>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/records" className="hover:text-foreground">
              기록
            </Link>
            <Link href="/search" className="hover:text-foreground">
              검색
            </Link>
            <Link href="/contents" className="hover:text-foreground">
              내 콘텐츠
            </Link>
            <Link href="/friends" className="hover:text-foreground">
              친구
            </Link>
            <Link href="/settings" className="hover:text-foreground">
              설정
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-3 px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
            {/* Approved TMDB logo, kept less prominent than the app name. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TMDB_LOGO} alt="TMDB" className="h-3" />
          </a>
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </div>
      </footer>
    </div>
  );
}
