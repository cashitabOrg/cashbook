"use client";

import { Fragment, useState, useTransition } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { createManager, editManager } from "@/app/actions/staff";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";

type StaffModalProps = {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  staff?: {
    id: string;
    full_name: string;
    username: string;
  } | null;
};

export default function StaffModal({
  isOpen,
  onClose,
  storeSlug,
  staff,
}: StaffModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!staff;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Check password confirmation if creating or updating password
    const pass = formData.get("password");
    const confirmPass = formData.get("confirmPassword");
    
    if (!isEditing || (isEditing && pass)) {
      if (pass !== confirmPass) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }
      if ((pass as string).length < 6) {
        toast.error("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
    }

    startTransition(async () => {
      if (isEditing && staff) {
        formData.append("id", staff.id);
        const res = await editManager(storeSlug, formData);
        if (res?.error) toast.error(res.error);
        else {
          toast.success("Manager updated");
          router.refresh();
          onClose();
        }
      } else {
        const res = await createManager(storeSlug, formData);
        if (res?.error) toast.error(res.error);
        else {
          toast.success("Manager created");
          router.refresh();
          onClose();
        }
      }
      setLoading(false);
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-slate-100">
                <div className="flex justify-between items-center mb-5">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-slate-900 flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    {isEditing ? "Edit Manager" : "Add New Manager"}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1" disabled={loading}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      required
                      defaultValue={staff?.full_name || ""}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                      Login Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      required
                      defaultValue={staff?.username || ""}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900"
                    />
                    {!isEditing && (
                      <p className="mt-1 text-xs text-slate-500">
                        They will use this username to log in to the POS.
                      </p>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 ">
                      {isEditing ? "New Password (leave blank to keep current)" : "Password"}
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      required={!isEditing}
                      minLength={6}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      required={!isEditing}
                      minLength={6}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-slate-900"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50"
                      onClick={onClose}
                      disabled={loading || isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || isPending}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      {loading || isPending ? "Saving..." : "Save Manager"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
