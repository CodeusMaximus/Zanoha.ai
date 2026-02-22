"use client";

import { useState } from "react";
import AddCustomerModal from "./Addcustomermodal";

export default function AddCustomerButton({ businessId }: { businessId: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800
                   dark:bg-white dark:text-black dark:hover:bg-zinc-100"
      >
        + Add Customer
      </button>

      {showModal && (
        <AddCustomerModal
          businessId={businessId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}