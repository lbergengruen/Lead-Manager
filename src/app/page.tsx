import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1>Lead Manager</h1>
      <p>Baseline app scaffold.</p>

      <div className="cardGrid">
        <Link className="card" href="/leads">
          <h2 className="cardTitle">Leads</h2>
          <p className="cardDesc">Track leads and status.</p>
        </Link>
        <Link className="card" href="/reminders">
          <h2 className="cardTitle">Reminders</h2>
          <p className="cardDesc">Overdue, today, upcoming follow-ups.</p>
        </Link>
        <Link className="card" href="/cadences">
          <h2 className="cardTitle">Cadences</h2>
          <p className="cardDesc">Email strategies and enrollments.</p>
        </Link>
        <Link className="card" href="/licenses">
          <h2 className="cardTitle">Licenses</h2>
          <p className="cardDesc">Renewals and outreach windows.</p>
        </Link>
        <Link className="card" href="/settings">
          <h2 className="cardTitle">Settings</h2>
          <p className="cardDesc">Configuration and integrations.</p>
        </Link>
      </div>
    </div>
  );
}
