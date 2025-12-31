import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md">
          {/* Logo and title */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <WalletIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">WealthView</span>
            </div>
            <p className="text-slate-400">Welcome back! Sign in to your account.</p>
          </div>

          {/* Clerk SignIn component */}
          <SignIn
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl",
                headerTitle: "text-white",
                headerSubtitle: "text-slate-400",
                socialButtonsBlockButton: "bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700",
                socialButtonsBlockButtonText: "text-white font-medium",
                dividerLine: "bg-slate-700",
                dividerText: "text-slate-500",
                formFieldLabel: "text-slate-300",
                formFieldInput: "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500",
                formButtonPrimary: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600",
                footerActionLink: "text-emerald-400 hover:text-emerald-300",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-emerald-400",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

function WalletIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
