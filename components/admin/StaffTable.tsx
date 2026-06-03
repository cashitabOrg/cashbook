"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteManager, toggleManagerStatus } from "@/app/actions/staff";
import { toast } from "sonner";
import { getPlanLimits } from "@/lib/plans";
import StaffHeader from "./staff/StaffHeader";
import StaffMobileList from "./staff/StaffMobileList";
import StaffDesktopTable from "./staff/StaffDesktopTable";
import StaffModal from "./StaffModal";
import UpgradePromptModal from "./UpgradePromptModal";
import { PlanType } from "@/lib/plans";

type Staff = {
  id: string;
  full_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
};

export default function StaffTable({
  storeSlug,
  staffList,
  plan,
  isExempt,
  totalUserCount,
  storeId = "",
  userEmail = "",
}: {
  storeSlug: string;
  staffList: Staff[];
  plan: string;
  isExempt?: boolean;
  totalUserCount: number;
  storeId?: string;
  userEmail?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Normalize legacy plans
  let activePlan = plan.toLowerCase() as PlanType;
  if ((activePlan as string) === 'basic') activePlan = 'growth';
  if ((activePlan as string) === 'pro') activePlan = 'business';

  const limits = getPlanLimits(activePlan);
  const usagePercentage = Math.min(100, (totalUserCount / limits.maxStaff) * 100);
  const isNearLimit = usagePercentage >= 80;
  const isLimitReached = totalUserCount >= limits.maxStaff;

  const handleEdit = (staff: Staff) => {
    setActiveStaff(staff);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    if (isLimitReached && !isExempt) {
      setUpgradeModalOpen(true);
      return;
    }
    setActiveStaff(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (id: string, name: string, targetStatus: boolean) => {
    setIsProcessing(id);
    startTransition(async () => {
      const res = await toggleManagerStatus(storeSlug, id, targetStatus);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`${name} is now ${targetStatus ? 'Active' : 'Deactivated'}`);
        router.refresh();
      }
      setIsProcessing(null);
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete manager ${name}? This action cannot be undone.`)) {
      return;
    }
    
    setIsProcessing(id);
    startTransition(async () => {
      const res = await deleteManager(storeSlug, id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Manager deleted successfully");
        router.refresh();
      }
      setIsProcessing(null);
    });
  };

  return (
    <>
      <StaffHeader 
        totalUserCount={totalUserCount}
        limits={limits}
        usagePercentage={usagePercentage}
        isNearLimit={isNearLimit}
        isLimitReached={isLimitReached}
        plan={activePlan}
        isExempt={isExempt}
        handleAddNew={handleAddNew}
      />

      <div className="px-2 lg:px-0 mt-6 lg:mt-8">
        <StaffMobileList 
          staffList={staffList}
          isProcessing={isProcessing}
          isPending={isPending}
          handleToggleStatus={handleToggleStatus}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />

        <StaffDesktopTable 
          staffList={staffList}
          isProcessing={isProcessing}
          isPending={isPending}
          handleToggleStatus={handleToggleStatus}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </div>

      <StaffModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveStaff(null);
        }}
        storeSlug={storeSlug}
        staff={activeStaff}
      />

      {upgradeModalOpen && (
        <UpgradePromptModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          title="Staff Limit Reached"
          description={`Your current ${activePlan.toUpperCase()} plan limits you to a maximum of ${limits.maxStaff} staff accounts.`}
          nextPlanName={activePlan === 'starter' ? 'growth' : 'business'}
          nextPlanPrice={activePlan === 'starter' ? '₦15,000/mo' : '₦35,000/mo'}
          storeSlug={storeSlug}
          storeId={storeId}
          userEmail={userEmail}
        />
      )}
    </>
  );
}
