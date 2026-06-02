import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/client.js";
import EmptyState from "../../components/EmptyState.jsx";
import FormField, { inputClasses } from "../../components/FormField.jsx";

const defaultValues = {
  name: "",
  relation: "",
  phone: "",
  isPrimary: false
};

const Contacts = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => (await api.get("/contacts")).data
  });
  const { register, handleSubmit, reset } = useForm({ defaultValues });

  useEffect(() => {
    if (editing) {
      reset(editing);
    } else {
      reset(defaultValues);
    }
  }, [editing, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      if (editing?._id) {
        return (await api.put(`/contacts/${editing._id}`, values)).data;
      }
      return (await api.post("/contacts", values)).data;
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
    }
  });

  const contacts = data?.contacts || [];

  const onSubmit = (values) => {
    setError("");
    saveMutation.mutate({
      ...values,
      isPrimary: Boolean(values.isPrimary)
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section>
        <p className="text-sm font-semibold text-teal-700">Emergency Contacts</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Trusted People</h1>
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
        <h2 className="text-lg font-bold text-slate-950">Saved Contacts</h2>
        {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading contacts...</p> : null}
        {!isLoading && !contacts.length ? (
          <div className="mt-4">
            <EmptyState title="No contacts yet" message="Add at least one contact for SOS notifications." />
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {contacts.map((contact) => (
            <div key={contact._id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-950">{contact.name}</p>
                  <p className="text-sm text-slate-500">{contact.relation} · {contact.phone}</p>
                  {contact.isPrimary ? (
                    <span className="mt-2 inline-flex rounded-md bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">
                      Primary
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-2">
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
                    onClick={() => deleteMutation.mutate(contact._id)}
                    className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                    title="Delete contact"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Contacts;
