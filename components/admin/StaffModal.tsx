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
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-[#1C1C1E] p-6 text-left align-middle shadow-xl transition-all border border-gray-100 dark:border-[#2C2C2E]">
                <div className="flex justify-between items-center mb-5">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                    {isEditing ? "Edit Manager" : "Add New Manager"}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1" disabled={loading}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      required
                      defaultValue={staff?.full_name || ""}
                      className="mt-1 block w-full rounded-md bg-white dark:bg-[#252528] border-gray-300 dark:border-[#3A3A3C] shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Login Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      required
                      defaultValue={staff?.username || ""}
                      className="mt-1 block w-full rounded-md bg-white dark:bg-[#252528] border-gray-300 dark:border-[#3A3A3C] shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 dark:text-white"
                    />
                    {!isEditing && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        They will use this username to log in to the POS.
                      </p>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100 dark:border-[#2C2C2E] mt-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isEditing ? "New Password (leave blank to keep current)" : "Password"}
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      required={!isEditing}
                      minLength={6}
                      className="mt-1 block w-full rounded-md bg-white dark:bg-[#252528] border-gray-300 dark:border-[#3A3A3C] shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      required={!isEditing}
                      minLength={6}
                      className="mt-1 block w-full rounded-md bg-white dark:bg-[#252528] border-gray-300 dark:border-[#3A3A3C] shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#2C2C2E]">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 dark:bg-[#2C2C2E] px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3A3A3C] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors disabled:opacity-50"
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
