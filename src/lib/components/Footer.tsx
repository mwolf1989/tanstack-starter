import { Separator } from "./ui/separator";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-muted-foreground">
              Built with ❤️ by{" "}
              <a
                href="https://github.com/mwolf1989"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-foreground"
              >
                mwolf1989
              </a>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a
                href="https://github.com/mwolf1989/tanstack-starter"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground"
              >
                GitHub
              </a>
              <Separator orientation="vertical" className="h-4" />
              <a
                href="https://tanstack.com/router/latest"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground"
              >
                TanStack Router
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 