import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Mail, MessageCircle, Phone, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/client.js";
import EmptyState from "../../components/EmptyState.jsx";
import FormField, { inputClasses } from "../../components/FormField.jsx";

const defaultValues = {
  name: "",
  relation: "",
  phone: "",
  email: "",
  priority: 3,
  notificationPreference: "sms",
  notes: "",
  isPrimary: false
};

const digitsOnly = (value = "") => value.replace(/\D/g, "");

const Contacts = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["contacts", search],
    queryFn: async () =>
      (
        await api.get("/contacts", {
          params: search ? { q: search } : {}
        })
      ).data
  });
  const { register, handleSubmit, reset } = useForm({ defaultValues });

  useEffect(() => {
    if (editing) {
      reset({
        ...defaultValues,
        ...editing,
        priority: editing.priority || 3
      });
    } else {
      reset(defaultValues);
    }
  }, [editing, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        ...values,
        priority: Number(values.priority || 3),
        isPrimary: Boolean(values.isPrimary)
      };
      if (editing?._id) {
        return (await api.put(`/contacts/${editing._id}`, payload)).data;
      }
      return (await api.post("/contacts", payload)).data;
    },
    onSuccess: async () => {
      setEditing(null);
      reset(defaultValues);
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => setError(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/contacts/${id}`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => setError(err.message)
  });

  const contacts = data?.contacts || [];
  const primaryContact = useMemo(
    () => contacts.find((contact) => contact.isPrimary),
    [contacts]
  );

  const onSubmit = (values) => {
    setError("");
    saveMutation.mutate(values);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section>
        <p className="text-sm font-semibold text-teal-700">Emergency Contacts</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Trusted People</h1>
        {primaryContact ? (
          <div className="mt-5 rounded-lg border border-teal-100 bg-teal-50 p-4">
            <p className="text-sm font-bold text-teal-800">Primary responder</p>
            <p className="mt-1 text-sm text-teal-800">
              {primaryContact.name} ({primaryContact.relation}) will appear first in SOS notifications.
            </p>
          </div>
        ) : null}
        <form className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-soft" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormField label="Name">
              <input className={inputClasses} required {...register("name")} />
            </FormField>
            <FormField label="Relation">
              <input className={inputClasses} required {...register("relation")} />
            </FormField>
            <FormField label="Phone number">
              <input className={inputClasses} required {...register("phone")} />
            </FormField>
            <FormField label="Email">
              <input className={inputClasses} type="email" placeholder="optional" {...register("email")} />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Priority">
                <select className={inputClasses} {...register("priority")}>
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <option key={priority} value={priority}>
                      {priority} {priority === 1 ? "(highest)" : ""}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Notify by">
                <select className={inputClasses} {...register("notificationPreference")}>
                  <option value="sms">SMS</option>
                  <option value="call">Phone call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="all">All channels</option>
                </select>
              </FormField>
            </div>
            <FormField label="Notes">
              <textarea className={`${inputClasses} min-h-20`} placeholder="Backup number, availability, or instructions" {...register("notes")} />
            </FormField>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" {...register("isPrimary")} />
              Primary contact
            </label>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {editing ? "Update contact" : "Add contact"}
            </button>
            {editing ? (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-950">Saved Contacts</h2>
          <label className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className={`${inputClasses} pl-9`}
              placeholder="Search contacts"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading contacts...</p> : null}
        {!isLoading && !contacts.length ? (
          <div className="mt-4">
            <EmptyState title="No contacts found" message="Add at least one contact for SOS notifications." />
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {contacts.map((contact) => {
            const whatsappNumber = digitsOnly(contact.phone);

            return (
              <div key={contact._id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{contact.name}</p>
                    <p className="text-sm text-slate-500">{contact.relation} - {contact.phone}</p>
                    {contact.email ? <p className="text-sm text-slate-500">{contact.email}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {contact.isPrimary ? (
                        <span className="inline-flex rounded-md bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">
                          Primary
                        </span>
                      ) : null}
                      <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                        Priority {contact.priority || 3}
                      </span>
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                        {contact.notificationPreference || "sms"}
                      </span>
                    </div>
                    {contact.notes ? <p className="mt-2 text-sm text-slate-600">{contact.notes}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`tel:${contact.phone}`}
                      className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                      title="Call contact"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </a>
                    {whatsappNumber ? (
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        title="Open WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : null}
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                        title="Email contact"
                      >
                        <Mail className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditing(contact)}
                      className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                      title="Edit contact"
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete ${contact.name}?`)) {
                          deleteMutation.mutate(contact._id);
                        }
                      }}
                      className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                      title="Delete contact"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Contacts;
