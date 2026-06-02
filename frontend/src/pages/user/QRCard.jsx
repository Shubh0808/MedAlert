import { QRCodeCanvas } from "qrcode.react";
import { Download, QrCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { listText } from "../../utils/format.js";

const QRCard = () => {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/profile")).data
  });

  const profile = data?.profile || user;
  const primaryContact = data?.contacts?.find((contact) => contact.isPrimary) || data?.contacts?.[0];
  const qrPayload = {
    name: profile?.fullName,
    bloodGroup: profile?.medicalProfile?.bloodGroup,
    allergies: profile?.medicalProfile?.allergies,
    emergencyContact: primaryContact
      ? {
          name: primaryContact.name,
          relation: primaryContact.relation,
          phone: primaryContact.phone
        }
      : null
  };

  const downloadQr = () => {
    const canvas = document.getElementById("medalert-qr-code");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "medalert-emergency-qr.png";
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-teal-700">QR Emergency Card</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Downloadable Medical QR</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Emergency QR</h2>
              <p className="text-sm text-slate-500">Contains critical public emergency details.</p>
            </div>
          </div>
          <div className="mt-5 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-5">
            <QRCodeCanvas
              id="medalert-qr-code"
              value={JSON.stringify(qrPayload)}
              size={240}
              includeMargin
              level="H"
            />
          </div>
          <button
            type="button"
            onClick={downloadQr}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download QR
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Card Preview</h2>
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <div className="bg-red-600 px-5 py-4 text-white">
              <p className="text-sm font-semibold uppercase tracking-normal">Emergency Medical Card</p>
              <h3 className="mt-1 text-2xl font-black">{profile?.fullName}</h3>
            </div>
            <div className="grid gap-4 bg-white p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Blood Group</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {profile?.medicalProfile?.bloodGroup || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Emergency Contact</p>
                <p className="mt-1 text-lg font-bold text-slate-950">
                  {primaryContact?.phone || "Not set"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Allergies</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {listText(profile?.medicalProfile?.allergies)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default QRCard;
