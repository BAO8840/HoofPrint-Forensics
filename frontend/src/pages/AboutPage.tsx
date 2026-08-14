export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <div className="text-xs uppercase tracking-wide text-gold font-medium mb-1">
        About This System
      </div>
      <h1 className="font-serif text-3xl text-navy mb-4">Forensic Hoofprint Analysis System</h1>
      <p className="text-gray-600 text-sm leading-relaxed mb-8">
        This application provides a research interface for the forensic classification of
        livestock hoofprints using a trained machine-learning model. It was developed as a
        final-year project at Abiola Ajimobi Technical University (AATU).
      </p>

      <div className="bg-white border border-parchment-border rounded p-6 mb-6">
        <h2 className="font-serif text-lg text-navy mb-4 pb-2 border-b border-parchment-border">
          Project Information
        </h2>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <InfoItem
            label="Project Title"
            value="Forensic Classification of Livestock Hoofprints Using Machine Learning"
          />
          <InfoItem label="Researchers" value="Okunola Micheal &amp; Bello Abdulsalam" />
          <InfoItem label="Institution" value="Abiola Ajimobi Technical University (AATU)" />
          <InfoItem label="Target Species" value="Cattle, Sheep and Goat" />
          <InfoItem label="Classification Model" value="Convolutional Neural Network (HoofNet v1.0)" />
          <InfoItem label="Academic Year" value="2024 / 2025" />
        </div>
      </div>

      <div className="bg-parchment-notice border border-gold-light rounded p-5 text-sm text-gray-700">
        <div className="text-xs uppercase text-gold font-medium mb-1">Important Notice</div>
        Classification outputs are for research and analytical purposes only. All results
        require appropriate human review and interpretation before use in any formal or legal
        context. This system does not constitute an official forensic determination.
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-gray-400 mb-0.5">{label}</div>
      <div
        className="text-navy font-medium"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
