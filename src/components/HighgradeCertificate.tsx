import type { CSSProperties } from "react";
import certificateBackground from "../assets/certificate/Background-img.png";
import academyLogo from "../assets/certificate/logo.png";
import defaultStudentPhoto from "../assets/certificate/student.png";

export type CertificateStatus = "Valid" | "Revoked" | "Expired";
export type CertificateTextFont = string;
export type CertificateTextAlign = "left" | "center" | "right";
export type CertificateEditableElementKey =
  | "logo"
  | "tagline"
  | "title"
  | "subtitle"
  | "certifyLine"
  | "name"
  | "completedLine"
  | "academy"
  | "courseLevel"
  | "descriptionOne"
  | "descriptionTwo"
  | "quote"
  | "directorTitle"
  | "directorOrg"
  | "issuedByLabel"
  | "issuedByValue"
  | "completionLabel"
  | "completionDate"
  | "courseLabel"
  | "courseValue"
  | "issuedDateLabel"
  | "issuedDateValue"
  | "qr"
  | "signature"
  | "photo";
export type CertificateEditableElement = {
  text?: string;
  top?: number;
  left?: number;
  width?: number;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: number;
  letterSpacing?: number;
  align?: CertificateTextAlign;
  color?: string;
};

export type CertificateTemplateData = {
  id?: number;
  name: string;
  backgroundImage?: string;
  logoImage?: string;
  signatureImage?: string;
  accentColor: string;
  navyColor: string;
  goldColor: string;
  logoTop: number;
  logoLeft: number;
  logoWidth: number;
  taglineTop: number;
  taglineLeft: number;
  taglineWidth: number;
  taglineFontSize: number;
  taglineLetterSpacing: number;
  nameTop: number;
  nameLeft: number;
  nameWidth: number;
  nameFontSize: number;
  nameFont: CertificateTextFont;
  nameFontWeight: number;
  nameLetterSpacing: number;
  nameAlign: CertificateTextAlign;
  courseTop: number;
  qrTop: number;
  qrRight: number;
  qrSize: number;
  showQr: boolean;
  signatureTop: number;
  signatureLeft: number;
  signatureWidth: number;
  photoLeft: number;
  photoBottom: number;
  photoSize: number;
  elements?: Partial<Record<CertificateEditableElementKey, CertificateEditableElement>>;
  status: "Active" | "Hidden";
  isDefault?: boolean;
};

export type CertificateData = {
  id?: number;
  studentName: string;
  studentId: string;
  certificateNo: string;
  courseName: string;
  courseLevel: string;
  batchName: string;
  duration: string;
  enrollmentDate: string;
  completionDate: string;
  issueDate: string;
  instructorName: string;
  directorName: string;
  studentPhoto?: string;
  signatureUrl?: string;
  status: CertificateStatus;
  verificationToken?: string;
  updatedAt?: string;
  templateId?: number | "";
  template?: CertificateTemplateData;
};

export const defaultCertificateTemplate: CertificateTemplateData = {
  name: "Highgrade Academy Classic",
  accentColor: "#dd0b5b",
  navyColor: "#D4AF37",
  goldColor: "#bd8a2e",
  logoTop: 8.55,
  logoLeft: 30.5,
  logoWidth: 39,
  taglineTop: 21.05,
  taglineLeft: 23.5,
  taglineWidth: 53,
  taglineFontSize: 0.68,
  taglineLetterSpacing: 0.52,
  nameTop: 42.05,
  nameLeft: 16,
  nameWidth: 68,
  nameFontSize: 3.55,
  nameFont: "Georgia",
  nameFontWeight: 800,
  nameLetterSpacing: 0,
  nameAlign: "center",
  courseTop: 47.9,
  qrTop: 4.3,
  qrRight: 5.2,
  qrSize: 10.2,
  showQr: true,
  signatureTop: 75.65,
  signatureLeft: 30.7,
  signatureWidth: 38.6,
  photoLeft: 43.7,
  photoBottom: 5.55,
  photoSize: 12.6,
  status: "Active",
  isDefault: true,
};

export const defaultCertificateData: CertificateData = {
  studentName: "Student Full Name",
  studentId: "HGFA-STU-0000",
  certificateNo: "HGFA-L1-000001",
  courseName: "Highgrade Fitness Academy",
  courseLevel: "Level 1 - Certified Fitness Trainer",
  batchName: "Level 1 Batch",
  duration: "12 weeks",
  enrollmentDate: "",
  completionDate: "",
  issueDate: "",
  instructorName: "Manoj Murugesan",
  directorName: "Manoj Murugesan",
  status: "Valid",
};

const formatCertificateDate = (value: string) => {
  if (!value) return "DD / MM / YYYY";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, " / ");
};

const qrImage = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=190x190&margin=8&data=${encodeURIComponent(value)}`;

const textFromTemplate = (
  elements: CertificateTemplateData["elements"],
  key: CertificateEditableElementKey,
  fallback: string,
) => elements?.[key]?.text ?? fallback;

const elementStyle = (
  elements: CertificateTemplateData["elements"],
  key: CertificateEditableElementKey,
): CSSProperties | undefined => {
  const item = elements?.[key];
  if (!item) return undefined;
  const style: CSSProperties = {};
  if (Number.isFinite(item.top) && Number.isFinite(item.left)) {
    style.position = "absolute";
    style.top = `${item.top}%`;
    style.left = `${item.left}%`;
    style.zIndex = 4;
  }
  if (Number.isFinite(item.width)) style.width = `${item.width}%`;
  if (item.fontFamily) (style as CSSProperties & Record<string, string>)["--certificate-element-font"] = `"${item.fontFamily}", Georgia, "Times New Roman", serif`;
  if (Number.isFinite(item.fontSize)) style.fontSize = `clamp(0.34rem, ${item.fontSize}cqw, 5rem)`;
  if (Number.isFinite(item.lineHeight)) style.lineHeight = item.lineHeight;
  if (Number.isFinite(item.fontWeight)) style.fontWeight = item.fontWeight;
  if (Number.isFinite(item.letterSpacing)) style.letterSpacing = `${item.letterSpacing}em`;
  if (item.align) style.textAlign = item.align;
  if (item.color) style.color = item.color;
  return Object.keys(style).length ? style : undefined;
};

export function HighgradeCertificate({
  certificate,
  verifyUrl,
  template,
  className = "",
}: {
  certificate: CertificateData;
  verifyUrl: string;
  template?: CertificateTemplateData;
  className?: string;
}) {
  const data = { ...defaultCertificateData, ...certificate };
  const activeTemplate = { ...defaultCertificateTemplate, ...(template || data.template || {}) };
  const safeSignatureTop = Math.min(Number(activeTemplate.signatureTop || defaultCertificateTemplate.signatureTop), 76.4);
  const nameFontStack = `"${activeTemplate.nameFont}", Georgia, "Times New Roman", serif`;
  const signatureImage = data.signatureUrl || activeTemplate.signatureImage || "";
  const elements = activeTemplate.elements || {};
  const style = {
    "--certificate-accent": activeTemplate.accentColor,
    "--certificate-navy": activeTemplate.navyColor,
    "--certificate-gold": activeTemplate.goldColor,
    "--certificate-logo-top": `${activeTemplate.logoTop}%`,
    "--certificate-logo-left": `${activeTemplate.logoLeft}%`,
    "--certificate-logo-width": `${activeTemplate.logoWidth}%`,
    "--certificate-tagline-top": `${activeTemplate.taglineTop}%`,
    "--certificate-tagline-left": `${activeTemplate.taglineLeft}%`,
    "--certificate-tagline-width": `${activeTemplate.taglineWidth}%`,
    "--certificate-tagline-size": `${activeTemplate.taglineFontSize}cqw`,
    "--certificate-tagline-spacing": `${activeTemplate.taglineLetterSpacing}em`,
    "--certificate-name-top": `${activeTemplate.nameTop}%`,
    "--certificate-name-left": `${activeTemplate.nameLeft}%`,
    "--certificate-name-width": `${activeTemplate.nameWidth}%`,
    "--certificate-name-size": `${activeTemplate.nameFontSize}cqw`,
    "--certificate-name-font": nameFontStack,
    "--certificate-name-weight": activeTemplate.nameFontWeight,
    "--certificate-name-spacing": `${activeTemplate.nameLetterSpacing}em`,
    "--certificate-name-align": activeTemplate.nameAlign,
    "--certificate-global-font": nameFontStack,
    "--certificate-course-top": `${activeTemplate.courseTop}%`,
    "--certificate-qr-top": `${activeTemplate.qrTop}%`,
    "--certificate-qr-right": `${activeTemplate.qrRight}%`,
    "--certificate-qr-size": `${activeTemplate.qrSize}%`,
    "--certificate-signature-top": `${safeSignatureTop}%`,
    "--certificate-signature-left": `${activeTemplate.signatureLeft}%`,
    "--certificate-signature-width": `${activeTemplate.signatureWidth}%`,
    "--certificate-photo-left": `${activeTemplate.photoLeft}%`,
    "--certificate-photo-bottom": `${activeTemplate.photoBottom}%`,
    "--certificate-photo-size": `${activeTemplate.photoSize}%`,
  } as CSSProperties;

  return (
    <article className={`highgrade-certificate ${className}`} style={style}>
      <img className="highgrade-certificate-background" src={activeTemplate.backgroundImage || certificateBackground} alt="" aria-hidden="true" />

      {activeTemplate.showQr && (
        <div className="highgrade-certificate-qr-block" data-certificate-zone="qr">
          <img src={qrImage(verifyUrl)} alt={`QR verification for ${data.certificateNo}`} />
          {/* <p>SCAN TO VERIFY</p> */}
          {/* <span>CERTIFICATE NO.</span >
          <strong>{data.certificateNo}</strong> */}
          <span>STUDENT ID</span>
          <strong>{data.studentId}</strong>
        </div>
      )}

      <header className="highgrade-certificate-header" data-certificate-zone="logo">
        <img src={activeTemplate.logoImage || academyLogo} alt="Highgrade Fitness Academy" />
      </header>
      <p className="highgrade-certificate-tagline" data-certificate-zone="tagline" style={elementStyle(elements, "tagline")}>{textFromTemplate(elements, "tagline", "Getting people moving since 2026")}</p>

      <div className="highgrade-certificate-watermark" aria-hidden="true" />

      <section className="highgrade-certificate-title-block">
        <span className="highgrade-certificate-laurel highgrade-certificate-laurel-left" aria-hidden="true" />
        <span className="highgrade-certificate-laurel highgrade-certificate-laurel-right" aria-hidden="true" />
        <h1 data-certificate-zone="title" style={elementStyle(elements, "title")}>{textFromTemplate(elements, "title", "Certificate")}</h1>
        <h2 data-certificate-zone="subtitle" style={elementStyle(elements, "subtitle")}>{textFromTemplate(elements, "subtitle", "Of Completion")}</h2>
        <p data-certificate-zone="certifyLine" style={elementStyle(elements, "certifyLine")}>{textFromTemplate(elements, "certifyLine", "This is to certify that")}</p>
      </section>

      <div className="highgrade-certificate-name" data-certificate-zone="name">
        <span style={elementStyle(elements, "name")}>{textFromTemplate(elements, "name", data.studentName)}</span>
        {/* <i aria-hidden="true" /> */}
      </div>

      <div className="highgrade-certificate-course">
        <em data-certificate-zone="completedLine" style={elementStyle(elements, "completedLine")}>{textFromTemplate(elements, "completedLine", "has successfully completed the")}</em>
        <strong data-certificate-zone="academy" style={elementStyle(elements, "academy")}>{textFromTemplate(elements, "academy", data.courseName)}</strong>
        <span data-certificate-zone="courseLevel" style={elementStyle(elements, "courseLevel")}>{textFromTemplate(elements, "courseLevel", data.courseLevel)}</span>
      </div>

      <div className="highgrade-certificate-description">
        <p data-certificate-zone="descriptionOne" style={elementStyle(elements, "descriptionOne")}>{textFromTemplate(elements, "descriptionOne", "and has demonstrated the required knowledge and practical competency in the fundamental principles of fitness instruction, exercise science, client assessment, human movement, exercise technique, nutrition fundamentals, and professional gym floor practice.")}</p>
        <p data-certificate-zone="descriptionTwo" style={elementStyle(elements, "descriptionTwo")}>{textFromTemplate(elements, "descriptionTwo", "This certificate is awarded in recognition of the successful completion of all required coursework, practical assessments, and final evaluation.")}</p>
        <blockquote data-certificate-zone="quote" style={elementStyle(elements, "quote")}>{textFromTemplate(elements, "quote", "This certificate verifies successful completion of the Highgrade Fitness Academy Level 1 - Certified Fitness Trainer programme.")}</blockquote>
      </div>

      <div className="highgrade-certificate-signature" data-certificate-zone="signature">
        {signatureImage ? <img src={signatureImage} alt={`${data.directorName} signature`} /> : <span />}
        <b />
        <p data-certificate-zone="directorTitle" style={elementStyle(elements, "directorTitle")}>{textFromTemplate(elements, "directorTitle", "Course Director & Instructor")}</p>
        <small data-certificate-zone="directorOrg" style={elementStyle(elements, "directorOrg")}>{textFromTemplate(elements, "directorOrg", "Highgrade Fitness Academy")}</small>
      </div>

      <div className="highgrade-certificate-photo" data-certificate-zone="photo">
        <img src={data.studentPhoto || defaultStudentPhoto} alt={data.studentName} />
      </div>

      <div className="highgrade-certificate-bottom highgrade-certificate-issued">
        <span data-certificate-zone="issuedByLabel" style={elementStyle(elements, "issuedByLabel")}>{textFromTemplate(elements, "issuedByLabel", "ISSUED BY")}</span>
        <strong data-certificate-zone="issuedByValue" style={elementStyle(elements, "issuedByValue")}>{textFromTemplate(elements, "issuedByValue", "Highgrade Fitness Academy")}</strong>
        <span data-certificate-zone="completionLabel" style={elementStyle(elements, "completionLabel")}>{textFromTemplate(elements, "completionLabel", "DATE OF COMPLETION")}</span>
        <strong data-certificate-zone="completionDate" style={elementStyle(elements, "completionDate")}>{textFromTemplate(elements, "completionDate", formatCertificateDate(data.completionDate))}</strong>
      </div>

      <div className="highgrade-certificate-bottom highgrade-certificate-course-meta">
        <span data-certificate-zone="courseLabel" style={elementStyle(elements, "courseLabel")}>{textFromTemplate(elements, "courseLabel", "COURSE")}</span>
        <strong data-certificate-zone="courseValue" style={elementStyle(elements, "courseValue")}>{textFromTemplate(elements, "courseValue", data.courseLevel)}</strong>
        <span data-certificate-zone="issuedDateLabel" style={elementStyle(elements, "issuedDateLabel")}>{textFromTemplate(elements, "issuedDateLabel", "ISSUED DATE")}</span>
        <strong data-certificate-zone="issuedDateValue" style={elementStyle(elements, "issuedDateValue")}>{textFromTemplate(elements, "issuedDateValue", formatCertificateDate(data.issueDate))}</strong>
      </div>
    </article>
  );
}
