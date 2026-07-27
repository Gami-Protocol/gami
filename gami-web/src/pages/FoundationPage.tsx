import { Link } from "react-router-dom";
import { GamiMark, GamiWordmark } from "@/components/gami/GamiMark";
import { GamiBrandLogo } from "@/components/gami/GamiBrandLogo";
import "./foundation.css";

const FOCUS = [
  {
    title: "Open coordination",
    copy: "Shared rails so builders, players, and partners can move value without reinventing trust each time.",
  },
  {
    title: "Stewarded protocol",
    copy: "Long-horizon care for the network — clarity on what stays open, what evolves, and why.",
  },
  {
    title: "Light infrastructure",
    copy: "A structure you can see through: luminous paths, clear edges, and room for the next builder.",
  },
] as const;

export function FoundationPage() {
  return (
    <div className="foundation-page">
      <div className="foundation-atmos" aria-hidden>
        <div className="foundation-mist" />
        <div className="foundation-hex" />
        <div className="foundation-beam" />
      </div>

      <div className="foundation-inner">
        <header className="foundation-top">
          <Link to="/" className="foundation-back">
            ← Protocol home
          </Link>
          <div className="foundation-top-mark">
            <GamiMark className="h-7 w-7" />
          </div>
        </header>

        <section className="foundation-hero" aria-label="Gami Foundation">
          <div className="foundation-logo-wrap">
            <GamiBrandLogo
              variant="landing"
              className="foundation-logo"
              decorative={false}
              alt="Gami"
            />
          </div>
          <h1 className="foundation-headline">
            Building the light-based structure for onchain play
          </h1>
          <p className="foundation-lede">
            Gami Foundation stewards the open layers that keep Gami clear, composable, and built for the long game.
          </p>
          <div className="foundation-cta">
            <a className="foundation-btn foundation-btn-primary" href="#mission">
              Our mission
            </a>
            <Link className="foundation-btn foundation-btn-ghost" to="/sale">
              Join the sale
            </Link>
          </div>
        </section>

        <section id="mission" className="foundation-section">
          <p className="foundation-kicker">Mission</p>
          <h2 className="foundation-section-title">Clarity over complexity</h2>
          <p className="foundation-section-body">
            We exist to keep the protocol open and understandable — so creators can ship, communities can own their
            progress, and the network stays lit for whoever builds next.
          </p>
        </section>

        <section className="foundation-section foundation-focus" aria-labelledby="focus-heading">
          <p className="foundation-kicker">Focus</p>
          <h2 id="focus-heading" className="foundation-section-title">
            What we hold in the light
          </h2>
          <p className="foundation-section-body">
            Three commitments that shape how Gami stays open, stewarded, and readable.
          </p>
          <ul className="foundation-focus-list">
            {FOCUS.map((item) => (
              <li key={item.title} className="foundation-focus-item">
                <GamiMark className="foundation-focus-mark" />
                <h3 className="foundation-focus-title">{item.title}</h3>
                <p className="foundation-focus-copy">{item.copy}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="foundation-section foundation-join">
          <p className="foundation-kicker">Participate</p>
          <h2 className="foundation-section-title">Build with the foundation</h2>
          <p className="foundation-section-body">
            Explore the protocol, join the sale, or follow along as we keep the structure open and luminous.
          </p>
          <div className="foundation-cta" style={{ marginTop: "1.25rem" }}>
            <Link className="foundation-btn foundation-btn-primary" to="/sale">
              Enter the sale
            </Link>
            <Link className="foundation-btn foundation-btn-ghost" to="/">
              Explore Gami
            </Link>
          </div>
        </section>

        <footer className="foundation-footer">
          <GamiWordmark foundation className="justify-center" />
          <p style={{ marginTop: "0.75rem" }}>© {new Date().getFullYear()} Gami Foundation</p>
        </footer>
      </div>
    </div>
  );
}
