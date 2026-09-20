/* Auth group layout — centered card on Paper White, no landing Navbar.
   Keeps the page focused on the form per the chosen option. */

export default function AuthLayout({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-white px-4 py-12 sm:py-16">
      {children}
    </main>
  );
}
