import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Phone, ExternalLink, Shield } from 'lucide-react';
import '../styles/data-pages.css';

const FAQ = [
  {
    q: 'How do I register a new beneficiary into the system?',
    a: 'Navigate to the Beneficiaries page from the main sidebar and click the "Add Beneficiary" button. You will be prompted to fill in essential details including their full legal name, FAYDA ID (if applicable), their assigned vulnerability category, and household size. Once saved, their profile is immediately synced across the network and they become eligible for upcoming aid distribution campaigns.',
  },
  {
    q: 'How does the distribution workflow prevent duplicate aid?',
    a: 'Our system enforces strict duplicate-checking at the point of distribution. When you search for and select a beneficiary in the "Distribute" tab, the database automatically cross-references their ID against all existing distribution logs for that specific campaign. If a duplicate is detected, the system physically blocks the distribution and displays a high-visibility warning detailing exactly when the previous aid was dispensed and which field worker processed it.',
  },
  {
    q: 'What happens when a campaign end date passes?',
    a: 'To ensure operational hygiene, the A.M.A.N.A.H platform automatically monitors campaign lifecycles. Whenever the system detects that an "Active" or "Paused" campaign has surpassed its scheduled end date, it will automatically transition the campaign status to "Completed". This locks the campaign from further distributions while preserving all historical data for auditing. Draft campaigns are explicitly excluded from this automation.',
  },
  {
    q: 'How are recurring member payments tracked and reconciled?',
    a: 'Member contributions are managed via the "Quick Payment" module on the Members page. When you record a transaction, the system logs the exact timestamp and amount, then recalculates the member\'s cumulative contributions for the current billing cycle. Based on their configured expected payment amount, the system will instantly and dynamically update their status badge (e.g., transitioning from "Pending" to "Partial" to "Paid"). Overdue statuses are also automatically flagged if a member misses their billing cycle.',
  },
  {
    q: 'Who has authorization to access and modify System Settings?',
    a: 'For security and compliance purposes, only users provisioned with the "Admin" role can access the System Settings panel (located under Administration). From there, administrators can toggle critical operational features on or off globally—such as locking down aid distribution entirely, pausing campaign management, or enabling advanced fraud prevention measures. Standard field workers do not have visibility into this area.',
  },
];

export default function Support() {
  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (i) => setOpenIdx(prev => prev === i ? null : i);

  return (
    <div className="data-page">
      <div className="data-page__header">
        <div className="data-page__header-left">
          <h1 className="data-page__title">Support</h1>
          <p className="data-page__subtitle">Help, documentation, and contact information.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: 720 }}>
        {/* FAQ */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-header">
            <HelpCircle size={18} strokeWidth={1.5} />
            <h3>Frequently Asked Questions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--outline-ghost)' }}>
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-4) 0', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--on-surface)', fontWeight: 'var(--font-weight-medium)',
                    fontSize: 'var(--font-size-base)', textAlign: 'left', gap: 'var(--space-3)',
                    font: 'inherit',
                  }}
                >
                  <span>{item.q}</span>
                  {openIdx === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {openIdx === i && (
                  <div style={{
                    padding: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-sm)',
                    color: 'var(--on-surface-variant)', lineHeight: 'var(--line-height-relaxed)',
                    animation: 'fadeIn var(--duration-fast) var(--ease-enter)',
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-header">
            <Mail size={18} strokeWidth={1.5} />
            <h3>Contact Support</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4) 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Mail size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--on-surface)' }}>Email</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>abdurahmanmifta225@gmail.com</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Phone size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--on-surface)' }}>Phone</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>+251920650157</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-header">
            <Shield size={18} strokeWidth={1.5} />
            <h3>System Information</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-6)', padding: 'var(--space-4) 0', fontSize: 'var(--font-size-sm)' }}>
            <span style={{ color: 'var(--outline)', fontWeight: 'var(--font-weight-semibold)' }}>Platform</span>
            <span style={{ color: 'var(--on-surface)' }}>A.M.A.N.A.H — Automated Membership And Networked Aid Hub</span>
            <span style={{ color: 'var(--outline)', fontWeight: 'var(--font-weight-semibold)' }}>Version</span>
            <span style={{ color: 'var(--on-surface)' }}>1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
