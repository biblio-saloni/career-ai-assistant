import ResumeUpload from "../components/ResumeUpload";
import Header from "../components/Header";

export default function Upload() {

  return (
    <>
      <Header/>
      <div className="upload-page-container">
        <h1 className="upload-page-title">Upload your resume</h1>

        <p className="upload-page-subtitle">
          We'll analyze your skills and match you with the best opportunities.
        </p>

        <ResumeUpload />
      </div>
    </>
  );
}
