import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-panel md:grid-cols-2 md:p-12">
      <div className="space-y-5">
        <p className="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
          Professional Resume Writing with AI
        </p>
        <h1 className="text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
          Build job-ready resumes in minutes.
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
          Enter your profile details, generate an ATS-friendly resume, and track every version from your dashboard.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700" to="/signup">
            Start Free
          </Link>
          <Link className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100" to="/login">
            Login
          </Link>
        </div>
      </div>
      <div className="rounded-xl bg-slate-950 p-6 text-slate-100">
        <h2 className="mb-3 text-lg font-bold">What you get</h2>
        <ul className="space-y-3 text-sm text-slate-300">
          <li>- AI-generated summary, experience, and skills sections</li>
          <li>- Secure user auth with JWT</li>
          <li>- Resume history saved in MongoDB</li>
          <li>- Clean, export-ready plain text resume output</li>
        </ul>
      </div>
    </section>
  );
}

export default Home;
