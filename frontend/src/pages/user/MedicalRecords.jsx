import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/client.js";
import EmptyState from "../../components/EmptyState.jsx";
import FormField, { inputClasses } from "../../components/FormField.jsx";
import { formatBytes, formatDateTime } from "../../utils/format.js";

const MedicalRecords = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      category: "prescription",
      tags: ""
    }
  });
  const { data, isLoading } = useQuery({
    queryKey: ["records"],
    queryFn: async () => (await api.get("/records")).data
  });

  const uploadMutation = useMutation({
    mutationFn: async (values) => {
      const file = values.file?.[0];
      if (!file) {
        throw new Error("Select a PDF or image file.");
      }

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("category", values.category);
      formData.append("tags", values.tags || "");
      formData.append("file", file);

      return (
        await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      ).data;
    },
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: ["records"] });
    },
    onError: (err) => setError(err.message)
  });

  const records = data?.records || [];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section>
        <p className="text-sm font-semibold text-teal-700">Medical Records</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Documents Vault</h1>
        <form
          className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
          onSubmit={handleSubmit((values) => {
            setError("");
            uploadMutation.mutate(values);
          })}
        >
          <div className="space-y-4">
            <FormField label="Record title">
              <input className={inputClasses} required {...register("title")} />
            </FormField>
            <FormField label="Category">
              <select className={inputClasses} {...register("category")}>
                <option value="prescription">Prescription</option>
                <option value="lab_report">Lab report</option>
                <option value="insurance">Insurance</option>
                <option value="imaging">Imaging</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Tags">
              <input className={inputClasses} placeholder="cardiology, annual" {...register("tags")} />
            </FormField>
            <FormField label="File">
              <input
                className={inputClasses}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                required
                {...register("file")}
              />
            </FormField>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {uploadMutation.isPending ? "Uploading..." : "Upload record"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-slate-950">Uploaded Records</h2>
        {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading records...</p> : null}
        {!isLoading && !records.length ? (
          <div className="mt-4">
            <EmptyState title="No records uploaded" message="Upload prescriptions, lab reports, insurance files, or medical images." icon={FileText} />
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {records.map((record) => (
            <article key={record._id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">{record.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {record.category.replace("_", " ")} · {formatBytes(record.size)} · {formatDateTime(record.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{record.originalName}</p>
                </div>
                <a
                  href={record.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  View
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MedicalRecords;
