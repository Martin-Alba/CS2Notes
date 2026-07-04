"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { createGroup } from "./actions";

export function CreateGroupForm() {
  const t = useTranslations("groups");
  const tCommon = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createGroup(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap gap-2"
    >
      <input
        name="name"
        placeholder={t("groupName")}
        required
        className="glass-input rounded-lg px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        className="glass-btn rounded-lg px-4 py-1.5 text-sm text-white hover:text-cs2-orange glow-orange"
      >
        {tCommon("create")}
      </button>
    </form>
  );
}
