"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { createMatch } from "./actions";
import { COMPETITIVE_MAPS } from "@/lib/constants";

export function CreateMatchForm({ groupId }: { groupId: string }) {
  const t = useTranslations("matches");
  const tCommon = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        formData.set("groupId", groupId);
        await createMatch(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        name="title"
        placeholder="e.g. Mirage Jul-2"
        required
        className="glass-input rounded-lg px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500"
      />
      <select
        name="mapName"
        required
        defaultValue=""
        className="glass-input rounded-lg px-3 py-1.5 text-sm text-zinc-200"
      >
        <option value="" disabled>
          {t("mapName")}
        </option>
        {COMPETITIVE_MAPS.map((map) => (
          <option key={map} value={map}>
            {map}
          </option>
        ))}
      </select>
      <label className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-300">
        <input
          type="checkbox"
          name="soloQ"
          value="true"
          className="h-4 w-4 rounded border-white/20 bg-white/5 text-cs2-orange accent-cs2-orange"
        />
        SoloQ
      </label>
      <button
        type="submit"
        className="glass-btn rounded-lg border border-cs2-orange/30 bg-cs2-orange/10 px-4 py-1.5 text-sm text-cs2-orange hover:bg-cs2-orange/20 glow-orange"
      >
        {tCommon("create")}
      </button>
    </form>
  );
}
