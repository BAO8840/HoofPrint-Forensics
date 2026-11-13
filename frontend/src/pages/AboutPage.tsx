import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function AboutPage() {
  useDocumentTitle("About");

  return (
    <div className="wrap">
      <div className="about-head">
        <img
          className="logo"
          src="/aatu-logo.png"
          alt="Abiola Ajimobi Technical University logo"
          width={185}
          height={84}
        />
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>
            About this system
          </p>
          <h1>Forensic Hoofprint Analysis System</h1>
        </div>
      </div>

      <p className="lead" style={{ marginTop: 0 }}>
        A research interface for classifying livestock hoofprints with a trained machine-learning
        model. It was developed as a final-year project at Abiola Ajimobi Technical University
        (AATU), Ibadan.
      </p>

      <section className="card" aria-labelledby="project-title">
        <h2 id="project-title">Project information</h2>
        <dl>
          <dt>Project title</dt>
          <dd>Forensic Classification of Livestock Hoofprints Using Machine Learning</dd>
          <dt>Researchers</dt>
          <dd>Okunola Micheal and Bello Abdulsalam</dd>
          <dt>Institution</dt>
          <dd>Abiola Ajimobi Technical University, Ibadan, Oyo State</dd>
          <dt>Target species</dt>
          <dd>Cattle, sheep and goat</dd>
          <dt>Classification model</dt>
          <dd>Random Forest on ResNet50 features (HoofNet v1.0)</dd>
          <dt>Academic year</dt>
          <dd>2025/2026</dd>
        </dl>
      </section>

      <div className="sup">
        <div>
          <span>Supervisor</span>
          <b>Dr O. S. Ola</b>
        </div>
        <div>
          <span>Co-supervisor</span>
          <b>Mrs J. A. Orire</b>
        </div>
      </div>

      <section className="card accent" aria-labelledby="notice-title" style={{ marginTop: 24 }}>
        <h2 id="notice-title">Important notice</h2>
        <p style={{ margin: 0 }}>
          Classification outputs are intended for research and analytical use only. Every result
          requires review and interpretation by a qualified person before it is used in any formal
          or legal setting. This system is not an official forensic determination.
        </p>
      </section>
    </div>
  );
}
