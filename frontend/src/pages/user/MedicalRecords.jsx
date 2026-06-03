import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, FileText, Save, Search, Star, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/client.js";
import EmptyState from "../../components/EmptyState.jsx";
import FormField, { inputClasses } from "../../components/FormField.jsx";
import { categoryLabel, downloadCsv, formatBytes, formatDate, formatDateTime } from "../../utils/format.js";

const uploadDefaults = {
  title: "",
  category: "prescription",
  tags: "",
  notes: "",
  documentDate: "",
  isFavorite: false
};

const MedicalRecords = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [tag, setTag] = useState("");
  const [editing, setEditing] = useState(null);
  const uploadForm = useForm({ defaultValues: uploadDefaults });
  const editForm = useForm({ defaultValues: uploadDefaults });

  const { data, isLoading } = useQuery({
    queryKey: ["records", search, category, favoriteOnly, tag],
    queryFn: async () =>
      (
        await api.get("/records", {
          params: {
            ...(search ? { q: search } : {}),
            ...(category ? { category } : {}),
            ...(favoriteOnly ? { favorite: true } : {}),
            ...(tag ? { tag } : {})
          }
        })
      ).data
  });
  const summary = useQuery({
    queryKey: ["records-summary"],
    queryFn: async () => (await api.get("/records/summary")).data
  });

  useEffect(() => {
    if (!editing) return;

    editForm.reset({
      title: editing.title,
      category: editing.category,
      tags: editing.tags?.join(", ") || "",
      notes: editing.notes || "",
      documentDate: editing.documentDate ? editing.documentDate.slice(0, 10) : "",
      isFavorite: Boolean(editing.isFavorite)
    });
  }, [editing, editForm]);

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
      formData.append("notes", values.notes || "");
      formData.append("documentDate", values.documentDate || "");
      formData.append("isFavorite", values.isFavorite ? "true" : "false");
      formData.append("file", file);

      return (
        await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      ).data;
    },
    onSuccess: async () => {
      uploadForm.reset(uploadDefaults);
      setMessage("Record uploaded.");
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      await queryClient.invalidateQueries({ queryKey: ["records-summary"] });
    },
    onError: (err) => setError(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: async (values) =>
      (
        await api.put(`/records/${editing._id}`, {
          ...values,
          isFavorite: Boolean(values.isFavorite)
        })
      ).data,
    onSuccess: async () => {
      setEditing(null);
      setMessage("Record metadata updated.");
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      await queryClient.invalidateQueries({ queryKey: ["records-summary"] });
    },
    onError: (err) => setError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/records/${id}`)).data,
    onSuccess: async () => {
      setMessage("Record deleted.");
      await queryClient.invalidateQueries({ queryKey: ["records"] });
      await queryClient.invalidateQueries({ queryKey: ["records-summary"] });
    },
    onError: (err) => setError(err.message)
  });

  const records = data?.records || [];
  const availableTags = summary.data?.tags || [];

  const exportRecords = () => {
    downloadCsv(
      "medalert-medical-records.csv",
      ["Title", "Category", "Size", "Favorite", "Document Date", "Uploaded", "Tags", "Notes"],
      records.map((record) => [
        record.title,
        categoryLabel(record.category),
        formatBytes(record.size),
        record.isFavorite ? "Yes" : "No",
        formatDate(record.documentDate),
        formatDateTime(record.createdAt),
        record.tags?.join("; ") || "",
        record.notes || ""
      ])
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section>
        <p className="text-sm font-semibold text-teal-700">Medical Records</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Documents Vault</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Records</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{summary.data?.totalRecords || 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Favorites</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{summary.data?.favoriteRecords || 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Storage</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{formatBytes(summary.data?.totalSize || 0)}</p>
          </div>
        </div>
        <form
          className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
          onSubmit={uploadForm.handleSubmit((values) => {
            setError("");
            setMessage("");
            uploadMutation.mutate(values);
          })}
        >
          <div className="space-y-4">
            <FormField label="Record title">
              <input className={inputClasses} required {...uploadForm.register("title")} />
            </FormField>
            <FormField label="Category">
              <select className={inputClasses} {...uploadForm.register("category")}>
                <option value="prescription">Prescription</option>
                <option value="lab_report">Lab report</option>
                <option value="insurance">Insurance</option>
                <option value="imaging">Imaging</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Document date">
              <input className={inputClasses} type="date" {...uploadForm.register("documentDate")} />
            </FormField>
            <FormField label="Tags">
              <input className={inputClasses} placeholder="cardiology, annual" {...uploadForm.register("tags")} />
            </FormField>
            <FormField label="Notes">
              <textarea className={`${inputClasses} min-h-20`} placeholder="Doctor advice, dosage, or report summary" {...uploadForm.register("notes")} />
            </FormField>
            <FormField label="File">
              <input
                className={inputClasses}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                required
                {...uploadForm.register("file")}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" {...uploadForm.register("isFavorite")} />
              Mark as favorite
            </label>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          {message ? <p className="mt-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-950">Uploaded Records</h2>
          <button
            type="button"
            onClick={exportRecords}
            disabled={!records.length}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.75fr_0.75fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className={`${inputClasses} pl-9`}
              placeholder="Search records"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select className={inputClasses} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            <option value="prescription">Prescription</option>
            <option value="lab_report">Lab report</option>
            <option value="insurance">Insurance</option>
            <option value="imaging">Imaging</option>
            <option value="other">Other</option>
          </select>
          <select className={inputClasses} value={tag} onChange={(event) => setTag(event.target.value)}>
            <option value="">All tags</option>
            {availableTags.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" checked={favoriteOnly} onChange={(event) => setFavoriteOnly(event.target.checked)} />
          Favorites only
        </label>

        {editing ? (
          <form
            className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4"
            onSubmit={editForm.handleSubmit((values) => {
              setError("");
              setMessage("");
              updateMutation.mutate(values);
            })}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Title">
                <input className={inputClasses} required {...editForm.register("title")} />
              </FormField>
              <FormField label="Category">
                <select className={inputClasses} {...editForm.register("category")}>
                  <option value="prescription">Prescription</option>
                  <option value="lab_report">Lab report</option>
                  <option value="insurance">Insurance</option>
                  <option value="imaging">Imaging</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
              <FormField label="Document date">
                <input className={inputClasses} type="date" {...editForm.register("documentDate")} />
              </FormField>
              <FormField label="Tags">
                <input className={inputClasses} {...editForm.register("tags")} />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Notes">
                  <textarea className={`${inputClasses} min-h-20`} {...editForm.register("notes")} />
                </FormField>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" {...editForm.register("isFavorite")} />
                Favorite
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </button>
            </div>
          </form>
        ) : null}

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
                  <div className="flex items-center gap-2">
                    {record.isFavorite ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" /> : null}
                    <h3 className="font-bold text-slate-950">{record.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {categoryLabel(record.category)} - {formatBytes(record.size)} - {formatDateTime(record.createdAt)}
                  </p>
                  {record.documentDate ? <p className="mt-1 text-xs text-slate-500">Document date: {formatDate(record.documentDate)}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">{record.originalName}</p>
                  {record.notes ? <p className="mt-2 text-sm text-slate-600">{record.notes}</p> : null}
                  {record.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {record.tags.map((item) => (
                        <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={record.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditing(record)}
                    className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                    title="Edit record"
                  >
                    <Edit className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete ${record.title}?`)) {
                        deleteMutation.mutate(record._id);
                      }
                    }}
                    className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MedicalRecords;
