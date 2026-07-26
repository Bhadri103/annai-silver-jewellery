import { useEffect, useMemo, useState } from "react";
import { Download, Printer, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import academyLogo from "../assets/program-logos/hgfa-logo-white.png";
import studentFallback from "../assets/certificate/user.jpeg";
import { CertificateData, defaultCertificateData } from "../components/HighgradeCertificate";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const localCertificates = (): CertificateData[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem("highgrade_certificates_cache") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const verifyUrlFor = (certificate: CertificateData) => {
  const value = certificate.verificationToken || certificate.certificateNo;
  return `${window.location.origin}/highgradeacademy/verify/${encodeURIComponent(value || "")}`;
};

const CertificateVerifyPage = () => {
  const { token } = useParams();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE}/certificates/verify/${encodeURIComponent(token || "")}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Certificate not found.");
        if (mounted) setCertificate(data.certificate);
      } catch (err) {
        const fallback = localCertificates().find((item) => item.verificationToken === token || item.certificateNo === token || item.studentId === token);
        if (fallback) {
          setCertificate(fallback);
        } else {
          setError(err instanceof Error ? err.message : "Certificate not found.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const data = useMemo(() => ({ ...defaultCertificateData, ...(certificate || {}) }), [certificate]);
  const verifyUrl = certificate ? verifyUrlFor(data) : "";
  const pdfUrl = certificate && token ? `${API_BASE}/certificates/verify/${encodeURIComponent(token)}/pdf?v=${encodeURIComponent(data.updatedAt || Date.now())}` : "";

  return (
    <div className="certificate-verify-page bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={academyLogo} alt="Highgrade Fitness Academy" className="h-16 w-auto object-contain" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Certificate Verification</p>
              <h1 className="text-2xl font-semibold text-amber-900">Highgrade Fitness Academy</h1>
            </div>
          </div>
          {certificate && (
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white"><Printer className="mr-2 inline h-4 w-4" />Print</button>
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium"><Download className="mr-2 inline h-4 w-4" />Download PDF</a>
            </div>
          )}
        </div>

        {loading && <div className="rounded-3xl border bg-white p-8 text-slate-500">Checking certificate...</div>}
        {!loading && error && <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-700">{error}</div>}
        {!loading && certificate && (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <img src={data.studentPhoto || studentFallback} alt={data.studentName} className="h-20 w-20 rounded-2xl object-contain" />
                <div>
                  <Status status={data.status} />
                  <h2 className="mt-2 text-xl font-semibold">{data.studentName}</h2>
                  <p className="text-sm text-slate-500">{data.studentId}</p>
                </div>
              </div>
              <dl className="mt-6 grid gap-4 text-sm">
                {[
                  ["Certificate No.", data.certificateNo],
                  ["Course", data.courseName],
                  ["Level", data.courseLevel],
                  ["Batch", data.batchName],
                  ["Duration", data.duration],
                  ["Enrollment Date", data.enrollmentDate || "-"],
                  ["Completion Date", data.completionDate || "-"],
                  ["Issue Date", data.issueDate || "-"],
                  ["Instructor", data.instructorName],
                  ["Director", data.directorName],
                  ["Last Updated", data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "-"],
                  ["Verified At", new Date().toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-slate-100 pb-3">
                    <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</dt>
                    <dd className="mt-1 font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <iframe title={`Certificate ${data.certificateNo}`} src={pdfUrl} className="h-[78vh] min-h-[680px] w-full rounded-2xl border bg-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Status = ({ status }: { status: CertificateData["status"] }) => {
  const tone = status === "Valid" ? "bg-green-100 text-green-700" : status === "Expired" ? "bg-amber-100 text-amber-700" : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}><ShieldCheck className="h-3.5 w-3.5" />{status}</span>;
};

export default CertificateVerifyPage;
