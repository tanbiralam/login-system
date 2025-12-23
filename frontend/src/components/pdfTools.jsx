import { useEffect, useRef, useState } from "react";

const API_BASE = "http://localhost:8000/api/pdf";
const emptyRow = { name: "", amount: "" };

const sanitizeRows = (rows) =>
  rows
    .map((row) => ({ name: row.name?.trim() || "", amount: row.amount }))
    .filter((row) => row.name);

export default function PdfTools() {
  const [activePdfId, setActivePdfId] = useState(null);
  const [status, setStatus] = useState("");
  const [parsedText, setParsedText] = useState("");
  const [financial, setFinancial] = useState(null);
  const [annotation, setAnnotation] = useState({
    companyName: "",
    engagementName: "",
    assets: [emptyRow],
    liabilities: [emptyRow],
  });
  const [uploading, setUploading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [annotating, setAnnotating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const pollTimer = useRef(null);
  const fileInputRef = useRef(null);

  const hydrateFromFinancial = (financialPayload) => {
    const assets =
      financialPayload?.categories?.Assets?.map((item) => ({
        name: item.name || "",
        amount: item.amount || "",
      })) || [];

    const liabilities =
      financialPayload?.categories?.["Liabilities & Equity"]?.map((item) => ({
        name: item.name || "",
        amount: item.amount || "",
      })) || [];

    setAnnotation({
      companyName: financialPayload?.company?.name || "",
      engagementName: financialPayload?.engagement?.name || "",
      assets: assets.length ? assets : [emptyRow],
      liabilities: liabilities.length ? liabilities : [emptyRow],
    });
  };

  useEffect(() => {
    loadLatestPdf();

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const loadLatestPdf = async () => {
    setLoadingExisting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/latest`, {
        credentials: "include",
      });

      if (!res.ok) {
        setStatus("");
        setFinancial(null);
        setParsedText("");
        setActivePdfId(null);
        setMessage("No stored PDF found. Upload a PDF to begin.");
        return;
      }

      const data = await res.json();
      setActivePdfId(data.data.pdfId);
      setStatus(data.data.status);
      setParsedText(data.data.parsed?.text || "");

      if (data.data.financial) {
        setFinancial(data.data.financial);
        hydrateFromFinancial(data.data.financial);
      }
    } catch (err) {
      setError("Failed to load stored PDF");
      setActivePdfId(null);
      setMessage("");
    } finally {
      setLoadingExisting(false);
    }
  };

  const loadParsedText = async (pdfId) => {
    try {
      const res = await fetch(`${API_BASE}/result/${pdfId}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setParsedText(data.data.text || "");
    } catch (err) {
      // ignore
    }
  };

  const loadFinancial = async (pdfId) => {
    try {
      const res = await fetch(`${API_BASE}/financial/${pdfId}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setFinancial(data.data);
      hydrateFromFinancial(data.data);
    } catch (err) {
      // ignore
    }
  };

  const pollStatus = (pdfId) => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setPolling(true);
    setStatus("CHECKING");
    const tick = async () => {
      try {
        const res = await fetch(`${API_BASE}/status/${pdfId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          setStatus("ERROR");
          setPolling(false);
          return;
        }

        const data = await res.json();
        const nextStatus = data.data.status;
        setStatus(nextStatus);

        if (nextStatus === "COMPLETED") {
          setPolling(false);
          await loadParsedText(pdfId);
          await loadFinancial(pdfId);
          setMessage("PDF processed successfully");
          return;
        }

        if (nextStatus === "FAILED") {
          setPolling(false);
          setError("PDF processing failed");
          return;
        }

        pollTimer.current = setTimeout(tick, 2000);
      } catch (err) {
        setStatus("ERROR");
        setPolling(false);
      }
    };

    tick();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a PDF to upload");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Upload failed");
      }

      const data = await res.json();
      setActivePdfId(data.pdfId);
      setStatus(data.status);
      pollStatus(data.pdfId);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const updateAnnotationRow = (section, index, field, value) => {
    setAnnotation((prev) => {
      const nextRows = [...prev[section]];
      nextRows[index] = { ...nextRows[index], [field]: value };
      return { ...prev, [section]: nextRows };
    });
  };

  const addAnnotationRow = (section) => {
    setAnnotation((prev) => ({
      ...prev,
      [section]: [...prev[section], { ...emptyRow }],
    }));
  };

  const handleAnnotate = async (e) => {
    e.preventDefault();
    if (!activePdfId) {
      setError("Upload or load a PDF first");
      return;
    }

    setAnnotating(true);
    setError("");
    setMessage("");

    const payload = {
      pdfId: activePdfId,
      companyName: annotation.companyName,
      engagementName: annotation.engagementName,
      assets: sanitizeRows(annotation.assets),
      liabilities: sanitizeRows(annotation.liabilities),
    };

    try {
      const res = await fetch(`${API_BASE}/annotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Annotation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      await loadFinancial(activePdfId);
      setMessage("Annotated PDF ready to download");
    } catch (err) {
      setError(err.message);
    } finally {
      setAnnotating(false);
    }
  };

  const currentFileUrl = activePdfId
    ? `${API_BASE}/file/${activePdfId}`
    : null;

  return (
    <div className="border rounded p-4 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">PDF Annotation</h2>
          <p className="text-sm text-gray-600">
            Upload, parse, and annotate the latest financial statement PDF.
          </p>
        </div>
        <button
          className="text-sm text-blue-600 underline"
          type="button"
          onClick={loadLatestPdf}
          disabled={loadingExisting}
        >
          {loadingExisting ? "Checking..." : "Load stored PDF"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="p-3 border rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Current PDF</p>
                <p className="text-sm text-gray-600">
                  {activePdfId ? `ID: ${activePdfId}` : "No PDF selected"}
                </p>
              </div>
              <div className="text-sm">
                Status:{" "}
                <span className="font-medium">
                  {status || "Not started"}
                </span>
              </div>
            </div>
            {currentFileUrl && (
              <a
                href={currentFileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 text-sm underline mt-2 inline-block"
              >
                Open stored PDF
              </a>
            )}
          </div>

          <div className="p-3 border rounded">
            <p className="text-sm font-semibold mb-2">Upload & parse</p>
            <form onSubmit={handleUpload} className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload PDF"}
              </button>
            </form>
          </div>

          <div className="p-3 border rounded">
            <p className="text-sm font-semibold mb-1">Parsed text</p>
            <div className="border h-40 overflow-y-auto p-2 text-sm bg-gray-50">
              {parsedText ? parsedText : "No parsed text yet."}
            </div>
          </div>
        </div>

        <div className="p-3 border rounded flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Annotate & regenerate PDF</p>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`annotated-${activePdfId || "pdf"}.pdf`}
                className="text-blue-600 text-sm underline"
              >
                Download latest
              </a>
            )}
          </div>
          <form onSubmit={handleAnnotate} className="flex flex-col gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Company</label>
                <input
                  className="border rounded p-2 text-sm"
                  value={annotation.companyName}
                  onChange={(e) =>
                    setAnnotation((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  placeholder="Company name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Engagement</label>
                <input
                  className="border rounded p-2 text-sm"
                  value={annotation.engagementName}
                  onChange={(e) =>
                    setAnnotation((prev) => ({
                      ...prev,
                      engagementName: e.target.value,
                    }))
                  }
                  placeholder="Balance Sheet"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Assets</p>
                <button
                  type="button"
                  className="text-xs text-blue-600 underline"
                  onClick={() => addAnnotationRow("assets")}
                >
                  Add row
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {annotation.assets.map((row, idx) => (
                  <div className="grid grid-cols-3 gap-2" key={`asset-${idx}`}>
                    <input
                      className="border rounded p-2 text-sm col-span-2"
                      placeholder="Name"
                      value={row.name}
                      onChange={(e) =>
                        updateAnnotationRow("assets", idx, "name", e.target.value)
                      }
                    />
                    <input
                      className="border rounded p-2 text-sm"
                      placeholder="Amount"
                      value={row.amount}
                      onChange={(e) =>
                        updateAnnotationRow(
                          "assets",
                          idx,
                          "amount",
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Liabilities & Equity</p>
                <button
                  type="button"
                  className="text-xs text-blue-600 underline"
                  onClick={() => addAnnotationRow("liabilities")}
                >
                  Add row
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {annotation.liabilities.map((row, idx) => (
                  <div
                    className="grid grid-cols-3 gap-2"
                    key={`liability-${idx}`}
                  >
                    <input
                      className="border rounded p-2 text-sm col-span-2"
                      placeholder="Name"
                      value={row.name}
                      onChange={(e) =>
                        updateAnnotationRow(
                          "liabilities",
                          idx,
                          "name",
                          e.target.value
                        )
                      }
                    />
                    <input
                      className="border rounded p-2 text-sm"
                      placeholder="Amount"
                      value={row.amount}
                      onChange={(e) =>
                        updateAnnotationRow(
                          "liabilities",
                          idx,
                          "amount",
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-3 py-2 rounded text-sm"
              disabled={annotating || polling}
            >
              {annotating ? "Annotating..." : "Annotate & download PDF"}
            </button>
          </form>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`mt-3 text-sm ${
            error ? "text-red-600" : "text-green-700"
          }`}
        >
          {error || message}
        </div>
      )}
    </div>
  );
}
