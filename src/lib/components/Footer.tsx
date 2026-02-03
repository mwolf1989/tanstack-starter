import { Separator } from "./ui/separator";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-muted-foreground">
              Heartwood SaaS Starter
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a
                href="https://github.com/heartwood-agency/heartwood-saas-starter"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground"
              >
                GitHub
              </a>
              <Separator orientation="vertical" className="h-4" />
              <a
                href="https://tanstack.com/start/latest"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-foreground"
              >
                TanStack Start
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
