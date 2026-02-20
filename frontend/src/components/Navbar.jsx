import { Link, useNavigate } from "react-router-dom";
import InstallPwaButton from "./InstallPwaButton";

function Navbar() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-extrabold tracking-tight text-brand-700">
          AI Resume Generator
        </Link>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <InstallPwaButton />
          <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" to="/">
            Home
          </Link>
          {token ? (
            <>
              <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" to="/dashboard">
                Dashboard
              </Link>
              <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" to="/history">
                History
              </Link>
              <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" to="/prompt-builder">
                Prompt CV
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100" to="/login">
                Login
              </Link>
              <Link className="rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-700" to="/signup">
                Signup
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
